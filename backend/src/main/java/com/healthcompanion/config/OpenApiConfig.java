package com.healthcompanion.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean
  OpenAPI healthCompanionOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Health Companion API")
                .version("v1")
                .description("Appointment, medical document, and health-assistant API."))
        .schemaRequirement(
            "bearerAuth",
            new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));
  }
}
