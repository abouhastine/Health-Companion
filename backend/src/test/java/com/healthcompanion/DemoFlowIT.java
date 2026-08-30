package com.healthcompanion;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcompanion.ai.LlmGateway;
import com.healthcompanion.domain.Role;
import com.healthcompanion.domain.User;
import com.healthcompanion.repository.UserRepository;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.mock.web.MockMultipartFile;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(
    properties = {
      "app.ai.chat-provider=none",
      "app.ai.embedding-provider=none",
      "spring.jpa.show-sql=false"
    })
@AutoConfigureMockMvc
@Testcontainers
@Import(DemoFlowIT.TestAiConfiguration.class)
class DemoFlowIT {
  private static final DockerImageName PGVECTOR_IMAGE =
      DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres");

  @Container
  static final PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>(PGVECTOR_IMAGE)
          .withDatabaseName("health_companion")
          .withUsername("health_companion")
          .withPassword("health_companion");

  @Container
  static final GenericContainer<?> minio =
      new GenericContainer<>(DockerImageName.parse("minio/minio:latest"))
          .withExposedPorts(9000)
          .withEnv("MINIO_ROOT_USER", "minioadmin")
          .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
          .withCommand("server", "/data");

  @DynamicPropertySource
  static void databaseProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add(
        "app.storage.minio.endpoint",
        () -> "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
    registry.add("app.storage.minio.access-key", () -> "minioadmin");
    registry.add("app.storage.minio.secret-key", () -> "minioadmin");
    registry.add("app.storage.minio.bucket", () -> "health-documents-test");
  }

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;

  private byte[] pdf;

  @BeforeEach
  void prepareAdmin() throws Exception {
    pdf = samplePdf();
    if (users.findByEmailIgnoreCase("admin@health-companion.demo").isEmpty()) {
      var admin = new User();
      admin.firstName = "Demo";
      admin.lastName = "Admin";
      admin.email = "admin@health-companion.demo";
      admin.passwordHash = passwords.encode("DemoPassword1!");
      admin.role = Role.ADMIN;
      users.save(admin);
    }
  }

  @Test
  void completesTheMainPatientAdminDocumentAndRagStoryWithAuthorization() throws Exception {
    var patient = register("patient@example.test");
    var otherPatient = register("other@example.test");
    var admin = login("admin@health-companion.demo", "DemoPassword1!");

    var practitioner =
        performJson(
            post("/api/admin/practitioners"),
            admin.token(),
            Map.of(
                "firstName", "Karim",
                "lastName", "Mansouri",
                "specialty", "Cardiology",
                "organization", "Health Companion Heart Center",
                "address", "8 Rue du Cœur, Paris",
                "languages", "French, English"),
            201);
    long practitionerId = practitioner.path("id").asLong();

    var start = LocalDateTime.now().plusDays(2).withNano(0);
    var slot =
        performJson(
            post("/api/admin/practitioners/" + practitionerId + "/slots"),
            admin.token(),
            Map.of("startAt", start, "endAt", start.plusMinutes(30), "available", true),
            201);
    long slotId = slot.path("id").asLong();

    mvc.perform(get("/api/practitioners/{id}/slots", practitionerId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(slotId));

    var appointment =
        performJson(
            post("/api/appointments"),
            patient.token(),
            Map.of("slotId", slotId, "reason", "Demo consultation"),
            201);
    long appointmentId = appointment.path("id").asLong();
    mvc.perform(
            delete("/api/appointments/{id}", appointmentId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherPatient.token())))
        .andExpect(status().isNotFound());
    mvc.perform(
            get("/api/appointments/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(patient.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

    var upload = new MockMultipartFile("file", "blood-test.pdf", "application/pdf", pdf);
    var uploaded =
        mvc.perform(
                multipart("/api/admin/documents")
                    .file(upload)
                    .param("patientId", Long.toString(patient.id()))
                    .param("practitionerId", Long.toString(practitionerId))
                    .param("documentType", "LAB_RESULT")
                    .param("title", "Blood Test — August 2026")
                    .param("documentDate", LocalDate.now().toString())
                    .header(HttpHeaders.AUTHORIZATION, bearer(admin.token())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("AVAILABLE"))
            .andExpect(jsonPath("$.storagePath").doesNotExist())
            .andReturn();
    long documentId = body(uploaded).path("id").asLong();

    mvc.perform(
            get("/api/documents/{id}", documentId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherPatient.token())))
        .andExpect(status().isNotFound());
    mvc.perform(
            get("/api/documents/{id}", documentId)
                .header(HttpHeaders.AUTHORIZATION, bearer(patient.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("AVAILABLE"))
        .andExpect(jsonPath("$.storagePath").doesNotExist());
    mvc.perform(
            get("/api/documents/{id}/download", documentId)
                .header(HttpHeaders.AUTHORIZATION, bearer(patient.token())))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_PDF))
        .andExpect(content().bytes(pdf));

    var firstAnswer =
        performJson(
            post("/api/ai/documents/" + documentId + "/chat"),
            patient.token(),
            Map.of("question", "Explain this result in simple terms."),
            200);
    long conversationId = firstAnswer.path("conversationId").asLong();
    org.assertj.core.api.Assertions.assertThat(
            firstAnswer.path("response").path("sources").path(0).path("page").asInt())
        .isEqualTo(1);
    performJson(
        post("/api/ai/documents/" + documentId + "/chat"),
        patient.token(),
        Map.of(
            "question", "Which value is outside the printed range?",
            "conversationId", conversationId),
        200);
    mvc.perform(
            get("/api/ai/conversations/{id}", conversationId)
                .header(HttpHeaders.AUTHORIZATION, bearer(patient.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(4));
    mvc.perform(
            get("/api/ai/conversations/{id}", conversationId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherPatient.token())))
        .andExpect(status().isNotFound());

    mvc.perform(
            delete("/api/appointments/{id}", appointmentId)
                .header(HttpHeaders.AUTHORIZATION, bearer(patient.token())))
        .andExpect(status().isNoContent());
  }

  private Session register(String email) throws Exception {
    var response =
        performJson(
            post("/api/auth/register"),
            null,
            Map.of(
                "firstName", "Demo",
                "lastName", "Patient",
                "email", email,
                "phone", "+33123456789",
                "password", "DemoPassword1!",
                "confirmPassword", "DemoPassword1!"),
            201);
    return new Session(response.path("id").asLong(), response.path("token").asText());
  }

  private Session login(String email, String password) throws Exception {
    var response =
        performJson(
            post("/api/auth/login"), null, Map.of("email", email, "password", password), 200);
    return new Session(response.path("id").asLong(), response.path("token").asText());
  }

  private JsonNode performJson(
      org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
      String token,
      Object payload,
      int status)
      throws Exception {
    request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(payload));
    if (token != null) request.header(HttpHeaders.AUTHORIZATION, bearer(token));
    return body(mvc.perform(request).andExpect(status().is(status)).andReturn());
  }

  private JsonNode body(MvcResult result) throws Exception {
    return json.readTree(result.getResponse().getContentAsByteArray());
  }

  private String bearer(String token) {
    return "Bearer " + token;
  }

  private byte[] samplePdf() throws Exception {
    try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
      var page = new PDPage();
      document.addPage(page);
      try (var content = new PDPageContentStream(document, page)) {
        content.beginText();
        content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
        content.newLineAtOffset(50, 750);
        content.showText("Ferritin: 18 ng/mL. Printed reference range: 20-150 ng/mL.");
        content.endText();
      }
      document.save(output);
      return output.toByteArray();
    }
  }

  record Session(long id, String token) {}

  @TestConfiguration
  static class TestAiConfiguration {
    @Bean
    @Primary
    LlmGateway groundedTestGateway() {
      return (instruction, context, question) ->
          "The report lists ferritin at 18 ng/mL and a printed range of 20-150 ng/mL.";
    }
  }
}
