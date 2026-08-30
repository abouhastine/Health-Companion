package com.healthcompanion.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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
      @Value("${app.ai.chat-model:qwen3:4b}") String model,
      @Value("${app.ai.temperature:0.2}") double temperature,
      @Value("${app.ai.context-size:4096}") int contextSize,
      @Value("${app.ai.keep-alive:10m}") String keepAlive,
      @Value("${app.ai.request-timeout:120s}") Duration timeout) {
    var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    var json = new ObjectMapper();
    return new LlmGateway() {
      private String body(
          String systemInstruction, String context, String question, boolean stream)
          throws Exception {
        return json.writeValueAsString(
            Map.of(
                "model",
                model,
                "stream",
                stream,
                "keep_alive",
                keepAlive,
                "options",
                Map.of("temperature", temperature, "num_ctx", contextSize),
                "messages",
                List.of(
                    Map.of("role", "system", "content", systemInstruction + "\n" + context),
                    Map.of("role", "user", "content", question))));
      }

      private HttpRequest request(String body) {
        return HttpRequest.newBuilder(URI.create(baseUrl + "/api/chat"))
            .timeout(timeout)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
      }

      @Override
      public String generate(String systemInstruction, String context, String question) {
        try {
          var response =
              client.send(
                  request(body(systemInstruction, context, question, false)),
                  HttpResponse.BodyHandlers.ofString());
          requireSuccess(response.statusCode(), response.body(), "Ollama chat");
          var answer = json.readTree(response.body()).path("message").path("content").asText();
          if (answer.isBlank()) throw new IllegalStateException("Ollama returned an empty answer");
          return answer;
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("Ollama request was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("Ollama request failed", exception);
        }
      }

      @Override
      public void generateStream(
          String systemInstruction,
          String context,
          String question,
          java.util.function.Consumer<String> onToken) {
        try {
          var response =
              client.send(
                  request(body(systemInstruction, context, question, true)),
                  HttpResponse.BodyHandlers.ofLines());
          if (response.statusCode() < 200 || response.statusCode() >= 300) {
            try (var lines = response.body()) {
              requireSuccess(
                  response.statusCode(), lines.reduce("", (a, b) -> a + b), "Ollama chat");
            }
          }
          try (var lines = response.body()) {
            lines.forEach(
                line -> {
                  try {
                    var content = json.readTree(line).path("message").path("content").asText();
                    if (!content.isEmpty()) onToken.accept(content);
                  } catch (Exception exception) {
                    throw new IllegalStateException("Invalid Ollama stream event", exception);
                  }
                });
          }
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("Ollama stream was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("Ollama streaming request failed", exception);
        }
      }
    };
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.embedding-provider", havingValue = "ollama")
  EmbeddingGateway ollamaEmbeddingGateway(
      @Value("${app.ai.ollama-base-url:http://localhost:11434}") String baseUrl,
      @Value("${app.ai.embedding-model:qwen3-embedding:0.6b}") String model,
      @Value("${app.ai.request-timeout:120s}") Duration timeout) {
    var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    var json = new ObjectMapper();
    return new EmbeddingGateway() {
      @Override
      public float[] embed(String text) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "input", text));
          var request =
              HttpRequest.newBuilder(URI.create(baseUrl + "/api/embed"))
                  .timeout(timeout)
                  .header("Content-Type", "application/json")
                  .POST(HttpRequest.BodyPublishers.ofString(body))
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofString());
          requireSuccess(response.statusCode(), response.body(), "Ollama embeddings");
          var values = json.readTree(response.body()).path("embeddings").path(0);
          if (!values.isArray() || values.isEmpty())
            throw new IllegalStateException("Ollama returned no embedding");
          var result = new float[values.size()];
          for (var index = 0; index < result.length; index++)
            result[index] = (float) values.get(index).asDouble();
          return result;
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("Ollama embedding request was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("Ollama embedding request failed", exception);
        }
      }

      @Override
      public String profile() {
        return "ollama:" + model;
      }
    };
  }

  private static void requireSuccess(int status, String body, String operation) {
    if (status < 200 || status >= 300)
      throw new IllegalStateException(
          operation + " failed with HTTP " + status + ": " + body.substring(0, Math.min(500, body.length())));
  }
}
