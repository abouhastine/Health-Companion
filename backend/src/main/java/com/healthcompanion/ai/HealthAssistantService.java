package com.healthcompanion.ai;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.AppointmentRepository;
import com.healthcompanion.repository.MedicalDocumentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class HealthAssistantService {
  private static final String DOCUMENT_INSTRUCTION =
      "Use only retrieved facts. Explain in plain language. Never diagnose, prescribe, recommend "
          + "treatment, or change medication. Do not infer or name a condition from a result. "
          + "Report only the printed value and reference range; do not say the patient has, likely "
          + "has, or is confirmed to have any condition.";
  private static final String LIMITATION =
      "This information does not establish a diagnosis or treatment plan. A healthcare professional can interpret it with your symptoms, history, and other results.";
  private final AiQueryRouter router;
  private final DocumentRagService documents;
  private final MedicalKnowledgeRagService knowledge;
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository medicalDocuments;
  private final LlmGateway llm;
  private final AiSafetyService safety;

  public HealthAssistantService(
      AiQueryRouter router,
      DocumentRagService documents,
      MedicalKnowledgeRagService knowledge,
      AppointmentRepository appointments,
      MedicalDocumentRepository medicalDocuments,
      LlmGateway llm,
      AiSafetyService safety) {
    this.router = router;
    this.documents = documents;
    this.knowledge = knowledge;
    this.appointments = appointments;
    this.medicalDocuments = medicalDocuments;
    this.llm = llm;
    this.safety = safety;
  }

  public AiResponse answer(AiQueryContext request) {
    return switch (router.route(request)) {
      case DOCUMENT_CONTEXT -> document(request);
      case HEALTH_RECORD -> record(request);
      case MEDICAL_KNOWLEDGE -> knowledge(request);
      case GENERAL -> general(request);
    };
  }

  private AiResponse document(AiQueryContext request) {
    var result = documents.retrieve(request.patientId(), request.documentId(), request.question());
    var answer =
        llm.generate(
            DOCUMENT_INSTRUCTION,
            withHistory(result.context(), request),
            request.question());
    return safeResponse(
        AiQueryMode.DOCUMENT_CONTEXT,
        structured("From Your Result", answer),
        result.chunks().stream()
            .map(
                c ->
                    new AiSource(
                        result.document().id, result.document().title, c.page, "PATIENT_DOCUMENT"))
            .toList(),
        false);
  }

  public AiResponse streamDocument(
      AiQueryContext request, java.util.function.Consumer<String> onToken) {
    var result = documents.retrieve(request.patientId(), request.documentId(), request.question());
    var heading = "From Your Result\n";
    var generated = new StringBuilder();
    llm.generateStream(
        DOCUMENT_INSTRUCTION,
        withHistory(result.context(), request),
        request.question(),
        generated::append);
    if (safety.unsafeAnswer(generated.toString())) {
      onToken.accept(AiSafetyService.SAFETY_RESPONSE);
      return new AiResponse(
          AiQueryMode.DOCUMENT_CONTEXT,
          AiSafetyService.SAFETY_RESPONSE,
          result.chunks().stream()
              .map(
                  c ->
                      new AiSource(
                          result.document().id, result.document().title, c.page, "PATIENT_DOCUMENT"))
              .toList(),
          false,
          true);
    }
    var answer = new StringBuilder(heading).append(generated);
    onToken.accept(answer.toString());
    var limitation = "\n\nWhat the AI Cannot Determine\n" + LIMITATION;
    answer.append(limitation);
    onToken.accept(limitation);
    return new AiResponse(
        AiQueryMode.DOCUMENT_CONTEXT,
        answer.toString(),
        result.chunks().stream()
            .map(
                c ->
                    new AiSource(
                        result.document().id, result.document().title, c.page, "PATIENT_DOCUMENT"))
            .toList(),
        false,
        false);
  }

  private AiResponse record(AiQueryContext request) {
    var question = request.question().toLowerCase();
    String facts;
    if (question.contains("result") || question.contains("résultat") || question.contains("exam")) {
      var patientDocuments =
          medicalDocuments.findByPatientIdOrderByDocumentDateDesc(request.patientId());
      if (question.contains("pending") || question.contains("attente")) {
        facts =
            patientDocuments.stream()
                .filter(document -> document.status == DocumentStatus.PROCESSING)
                .map(document -> document.title + " (processing)")
                .reduce((left, right) -> left + "; " + right)
                .map(value -> "Pending medical results: " + value + ".")
                .orElse("No medical results are currently processing.");
      } else {
        facts =
            patientDocuments.stream()
                .findFirst()
                .map(
                    d ->
                        "Latest medical result: "
                            + d.title
                            + " ("
                            + d.documentType
                            + ", "
                            + d.documentDate
                            + ", "
                            + d.status
                            + ").")
                .orElse("No medical results found.");
      }
    } else {
      var now = LocalDateTime.now();
      var future =
          appointments.findByPatientIdOrderBySlotStartAtDesc(request.patientId()).stream()
              .filter(
                  appointment ->
                      appointment.status == AppointmentStatus.CONFIRMED
                          && appointment.slot.startAt.isAfter(now))
              .sorted(java.util.Comparator.comparing(appointment -> appointment.slot.startAt))
              .toList();
      if (question.contains("week") || question.contains("semaine")) {
        facts =
            future.stream()
                .filter(appointment -> appointment.slot.startAt.isBefore(now.plusDays(7)))
                .map(this::appointmentFact)
                .reduce((left, right) -> left + "; " + right)
                .map(value -> "Appointments in the next seven days: " + value + ".")
                .orElse("No confirmed appointments are scheduled in the next seven days.");
      } else if (question.contains("appointments") || question.contains("rendez-vous")) {
        facts =
            future.stream()
                .limit(5)
                .map(this::appointmentFact)
                .reduce((left, right) -> left + "; " + right)
                .map(value -> "Upcoming appointments: " + value + ".")
                .orElse("No future confirmed appointments found.");
      } else {
        facts =
            future.stream()
                .findFirst()
                .map(appointment -> "Next appointment: " + appointmentFact(appointment) + ".")
                .orElse("No future confirmed appointments found.");
      }
    }
    return safeResponse(
        AiQueryMode.HEALTH_RECORD,
        llm.generate(
            "Format only these supplied facts. Do not add clinical advice.",
            withHistory(facts, request),
            request.question()),
        List.of(),
        false);
  }

  private String appointmentFact(Appointment appointment) {
    return "Dr. " + appointment.practitioner.lastName + " at " + appointment.slot.startAt;
  }

  private AiResponse knowledge(AiQueryContext request) {
    var result = knowledge.retrieve(request.question());
    if (result.chunks().isEmpty()) return general(request);
    var answer =
        llm.generate(
            "Educational information only; no diagnosis or treatment advice.",
            withHistory(result.context(), request),
            request.question());
    return safeResponse(
        AiQueryMode.MEDICAL_KNOWLEDGE,
        structured("General Explanation", answer),
        result.chunks().stream()
            .map(
                chunk ->
                    new AiSource(
                        null,
                        chunk.source
                            + (chunk.topic == null || chunk.topic.isBlank()
                                ? ""
                                : " · " + chunk.topic),
                        null,
                        "MEDICAL_KNOWLEDGE"))
            .distinct()
            .toList(),
        false);
  }

  private AiResponse general(AiQueryContext request) {
    return safeResponse(
        AiQueryMode.GENERAL,
        structured(
            "General Explanation",
            llm.generate(
                "General education only; no diagnosis or treatment.",
                withHistory("", request),
                request.question())),
        List.of(),
        true);
  }

  private String withHistory(String context, AiQueryContext request) {
    return context
        + "\nPrevious conversation (use only for continuity):\n"
        + request.conversationHistory();
  }

  private String structured(String heading, String answer) {
    return heading + "\n" + answer + "\n\nWhat the AI Cannot Determine\n" + LIMITATION;
  }

  private AiResponse safeResponse(
      AiQueryMode mode, String answer, List<AiSource> sources, boolean generalKnowledgeNotice) {
    if (safety.unsafeAnswer(answer))
      return new AiResponse(
          mode, AiSafetyService.SAFETY_RESPONSE, sources, generalKnowledgeNotice, true);
    return new AiResponse(mode, answer, sources, generalKnowledgeNotice, false);
  }

  public record AiResponse(
      AiQueryMode mode,
      String answer,
      List<AiSource> sources,
      boolean generalKnowledgeNotice,
      boolean safetyBlocked) {}

  public record AiSource(Long documentId, String title, Integer page, String scope) {}
}
