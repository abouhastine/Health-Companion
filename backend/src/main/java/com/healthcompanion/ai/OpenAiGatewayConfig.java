package com.healthcompanion.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAiGatewayConfig {
  @Bean
  @ConditionalOnProperty(name = "app.ai.chat-provider", havingValue = "openai")
  LlmGateway openAiGateway(@Value("${app.ai.openai-api-key}") String apiKey,
      @Value("${app.ai.chat-model}") String model) {
    var client = HttpClient.newHttpClient();
    var json = new ObjectMapper();
    return (systemInstruction, context, question) -> {
      try {
        var body = json.writeValueAsString(Map.of("model", model, "messages", List.of(
            Map.of("role", "system", "content", systemInstruction + "\n" + context),
            Map.of("role", "user", "content", question))));
        var request = authenticatedRequest("/v1/chat/completions", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        return json.readTree(client.send(request, HttpResponse.BodyHandlers.ofString()).body())
            .path("choices").path(0).path("message").path("content").asText();
      } catch (Exception exception) { throw new IllegalStateException("OpenAI request failed", exception); }
    };
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.embedding-provider", havingValue = "openai")
  EmbeddingGateway openAiEmbeddingGateway(@Value("${app.ai.openai-api-key}") String apiKey,
      @Value("${app.ai.embedding-model}") String model) {
    var client = HttpClient.newHttpClient();
    var json = new ObjectMapper();
    return new EmbeddingGateway() {
      @Override public float[] embed(String text) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "input", text));
          var request = authenticatedRequest("/v1/embeddings", apiKey)
              .POST(HttpRequest.BodyPublishers.ofString(body)).build();
          var values = json.readTree(client.send(request, HttpResponse.BodyHandlers.ofString()).body())
              .path("data").path(0).path("embedding");
          var result = new float[values.size()];
          for (var index = 0; index < result.length; index++) result[index] = (float) values.get(index).asDouble();
          return result;
        } catch (Exception exception) { throw new IllegalStateException("OpenAI embedding request failed", exception); }
      }
      @Override public String profile() { return "openai:" + model; }
    };
  }

  private static HttpRequest.Builder authenticatedRequest(String path, String apiKey) {
    return HttpRequest.newBuilder(URI.create("https://api.openai.com" + path))
        .header("Authorization", "Bearer " + apiKey).header("Content-Type", "application/json");
  }
}
