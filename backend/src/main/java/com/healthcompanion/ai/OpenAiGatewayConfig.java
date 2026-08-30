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
public class OpenAiGatewayConfig {
  private static HttpRequest.Builder authenticatedRequest(
      String path, String apiKey, Duration timeout) {
    return HttpRequest.newBuilder(URI.create("https://api.openai.com" + path))
        .timeout(timeout)
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json");
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.chat-provider", havingValue = "openai")
  LlmGateway openAiGateway(
      @Value("${app.ai.openai-api-key}") String apiKey,
      @Value("${app.ai.chat-model}") String model,
      @Value("${app.ai.temperature:0.2}") double temperature,
      @Value("${app.ai.request-timeout:120s}") Duration timeout) {
    requireApiKey(apiKey);
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
                "temperature",
                temperature,
                "stream",
                stream,
                "messages",
                List.of(
                    Map.of("role", "developer", "content", systemInstruction + "\n" + context),
                    Map.of("role", "user", "content", question))));
      }

      @Override
      public String generate(String systemInstruction, String context, String question) {
        try {
          var request =
              authenticatedRequest("/v1/chat/completions", apiKey, timeout)
                  .POST(
                      HttpRequest.BodyPublishers.ofString(
                          body(systemInstruction, context, question, false)))
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofString());
          requireSuccess(response.statusCode(), response.body(), "OpenAI chat");
          var answer =
              json.readTree(response.body())
                  .path("choices")
                  .path(0)
                  .path("message")
                  .path("content")
                  .asText();
          if (answer.isBlank()) throw new IllegalStateException("OpenAI returned an empty answer");
          return answer;
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("OpenAI request was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("OpenAI request failed", exception);
        }
      }

      @Override
      public void generateStream(
          String systemInstruction,
          String context,
          String question,
          java.util.function.Consumer<String> onToken) {
        try {
          var request =
              authenticatedRequest("/v1/chat/completions", apiKey, timeout)
                  .header("Accept", "text/event-stream")
                  .POST(
                      HttpRequest.BodyPublishers.ofString(
                          body(systemInstruction, context, question, true)))
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofLines());
          if (response.statusCode() < 200 || response.statusCode() >= 300) {
            try (var lines = response.body()) {
              requireSuccess(
                  response.statusCode(), lines.reduce("", (a, b) -> a + b), "OpenAI chat");
            }
          }
          try (var lines = response.body()) {
            lines
                .filter(line -> line.startsWith("data:"))
                .map(line -> line.substring(5).trim())
                .filter(data -> !data.equals("[DONE]"))
                .forEach(
                    data -> {
                      try {
                        var content =
                            json.readTree(data)
                                .path("choices")
                                .path(0)
                                .path("delta")
                                .path("content")
                                .asText();
                        if (!content.isEmpty()) onToken.accept(content);
                      } catch (Exception exception) {
                        throw new IllegalStateException(
                            "Invalid OpenAI stream event", exception);
                      }
                    });
          }
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("OpenAI stream was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("OpenAI streaming request failed", exception);
        }
      }
    };
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.embedding-provider", havingValue = "openai")
  EmbeddingGateway openAiEmbeddingGateway(
      @Value("${app.ai.openai-api-key}") String apiKey,
      @Value("${app.ai.embedding-model}") String model,
      @Value("${app.ai.request-timeout:120s}") Duration timeout) {
    requireApiKey(apiKey);
    var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    var json = new ObjectMapper();
    return new EmbeddingGateway() {
      @Override
      public float[] embed(String text) {
        try {
          var body = json.writeValueAsString(Map.of("model", model, "input", text));
          var request =
              authenticatedRequest("/v1/embeddings", apiKey, timeout)
                  .POST(HttpRequest.BodyPublishers.ofString(body))
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofString());
          requireSuccess(response.statusCode(), response.body(), "OpenAI embeddings");
          var values =
              json.readTree(response.body()).path("data").path(0).path("embedding");
          if (!values.isArray() || values.isEmpty())
            throw new IllegalStateException("OpenAI returned no embedding");
          var result = new float[values.size()];
          for (var index = 0; index < result.length; index++)
            result[index] = (float) values.get(index).asDouble();
          return result;
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("OpenAI embedding request was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("OpenAI embedding request failed", exception);
        }
      }

      @Override
      public String profile() {
        return "openai:" + model;
      }
    };
  }

  private static void requireApiKey(String apiKey) {
    if (apiKey == null || apiKey.isBlank())
      throw new IllegalStateException("OPENAI_API_KEY is required for the OpenAI profile");
  }

  private static void requireSuccess(int status, String body, String operation) {
    if (status < 200 || status >= 300)
      throw new IllegalStateException(
          operation + " failed with HTTP " + status + ": " + body.substring(0, Math.min(500, body.length())));
  }
}
