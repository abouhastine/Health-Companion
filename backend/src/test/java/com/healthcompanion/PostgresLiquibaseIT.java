package com.healthcompanion;

import static org.assertj.core.api.Assertions.assertThat;

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

  @Test
  void liquibaseBootstrapsPgvectorSchemaValidatedByHibernate() {
    assertThat(
            jdbc.queryForObject(
                "select count(*) from databasechangelog where exectype = 'EXECUTED'",
                Integer.class))
        .isEqualTo(4);
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
}
