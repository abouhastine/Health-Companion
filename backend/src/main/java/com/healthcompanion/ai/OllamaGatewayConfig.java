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
      private String body(String systemInstruction, String context, String question)
          throws Exception {
        return json.writeValueAsString(
            Map.of(
                "model",
                model,
                "stream",
                false,
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
                  request(body(systemInstruction, context, question)),
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
    };
  }

  private static void requireSuccess(int status, String body, String operation) {
    if (status < 200 || status >= 300)
      throw new IllegalStateException(
          operation + " failed with HTTP " + status + ": " + body.substring(0, Math.min(500, body.length())));
  }
}
