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
public class OllamaGatewayConfig {
  @Bean
  @ConditionalOnProperty(name = "app.ai.chat-provider", havingValue = "ollama")
  LlmGateway ollamaGateway(
      @Value("${app.ai.ollama-base-url:http://localhost:11434}") String baseUrl,
      @Value("${app.ai.chat-model:qwen3:4b}") String model) {
    var client = HttpClient.newHttpClient();
    var json = new ObjectMapper();
    return new LlmGateway() {
      @Override public String generate(String systemInstruction, String context, String question) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "stream", false, "messages", List.of(
              Map.of("role", "system", "content", systemInstruction + "\n" + context),
              Map.of("role", "user", "content", question))));
          var request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/chat")).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
          return json.readTree(client.send(request, HttpResponse.BodyHandlers.ofString()).body()).path("message").path("content").asText();
        } catch (Exception exception) { throw new IllegalStateException("Ollama request failed", exception); }
      }
      @Override public void generateStream(String systemInstruction, String context, String question, java.util.function.Consumer<String> onToken) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "stream", true, "messages", List.of(
              Map.of("role", "system", "content", systemInstruction + "\n" + context),
              Map.of("role", "user", "content", question))));
          var request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/chat")).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
          for (var line : client.send(request, HttpResponse.BodyHandlers.ofLines()).body().toList()) {var content=json.readTree(line).path("message").path("content").asText();if(!content.isEmpty())onToken.accept(content);}
        } catch (Exception exception) { throw new IllegalStateException("Ollama streaming request failed", exception); }
      }
    };
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.embedding-provider", havingValue = "ollama")
  EmbeddingGateway ollamaEmbeddingGateway(
      @Value("${app.ai.ollama-base-url:http://localhost:11434}") String baseUrl,
      @Value("${app.ai.embedding-model:qwen3-embedding:0.6b}") String model) {
    var client = HttpClient.newHttpClient();
    var json = new ObjectMapper();
    return new EmbeddingGateway() {
      @Override public float[] embed(String text) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "input", text));
          var request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/embed"))
              .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
          var values = json.readTree(client.send(request, HttpResponse.BodyHandlers.ofString()).body()).path("embeddings").path(0);
          var result = new float[values.size()];
          for (var index = 0; index < result.length; index++) result[index] = (float) values.get(index).asDouble();
          return result;
        } catch (Exception exception) { throw new IllegalStateException("Ollama embedding request failed", exception); }
      }
      @Override public String profile() { return "ollama:" + model; }
    };
  }
}
