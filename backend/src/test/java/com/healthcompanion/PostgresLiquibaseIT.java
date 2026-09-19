package com.healthcompanion;

import static org.assertj.core.api.Assertions.assertThat;

import com.healthcompanion.ai.PgVectorStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
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
@Testcontainers
class PostgresLiquibaseIT {
  private static final DockerImageName PGVECTOR_IMAGE =
      DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres");

  @Container
  static final PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>(PGVECTOR_IMAGE)
          .withDatabaseName("health_companion")
          .withUsername("health_companion")
          .withPassword("health_companion");

  @DynamicPropertySource
  static void databaseProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired JdbcTemplate jdbc;
  @Autowired PgVectorStore vectors;

  @Test
  void liquibaseBootstrapsPgvectorSchemaValidatedByHibernate() {
    assertThat(
            jdbc.queryForObject(
                "select count(*) from databasechangelog where exectype = 'EXECUTED'",
                Integer.class))
        .isEqualTo(6);
    assertThat(
            jdbc.queryForObject(
                "select count(*) from pg_extension where extname = 'vector'", Integer.class))
        .isEqualTo(1);
    assertThat(
            jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_name = 'medical_documents'",
                Integer.class))
        .isEqualTo(1);
    assertThat(
            jdbc.queryForObject(
                "select count(*) from pg_indexes where indexname = 'idx_medical_documents_patient_date'",
                Integer.class))
        .isEqualTo(1);
  }

  @Test
  void retrievesOnlyEmbeddingsWithTheSameProfileAndDimension() {
    var threeDimensions = knowledgeChunk("shared-profile", 3);
    var fourDimensions = knowledgeChunk("shared-profile", 4);
    vectors.storeKnowledgeEmbedding(threeDimensions, new float[] {1, 0, 0}, "shared-profile");
    vectors.storeKnowledgeEmbedding(fourDimensions, new float[] {1, 0, 0, 0}, "shared-profile");

    assertThat(vectors.nearestKnowledgeChunks(new float[] {1, 0, 0}, "shared-profile", 4))
        .containsExactly(threeDimensions);
    assertThat(vectors.nearestKnowledgeChunks(new float[] {1, 0, 0, 0}, "shared-profile", 4))
        .containsExactly(fourDimensions);
  }

  private long knowledgeChunk(String profile, int dimension) {
    return jdbc.queryForObject(
        "insert into knowledge_chunks (source, chunk_index, content, embedding_profile, embedding_dimension) "
            + "values (?, ?, ?, ?, ?) returning id",
        Long.class,
        "Integration test",
        dimension,
        "Dimension isolation test",
        profile,
        dimension);
  }
}
