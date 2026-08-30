package com.healthcompanion.ai;

import static org.junit.jupiter.api.Assertions.*;

import com.healthcompanion.domain.AiQueryMode;
import org.junit.jupiter.api.Test;

class DeterministicAiQueryRouterTest {
  private final AiQueryRouter router = new DeterministicAiQueryRouter();

  @Test
  void routesSelectedDocumentFirst() {
    assertEquals(
        AiQueryMode.DOCUMENT_CONTEXT,
        router.route(new AiQueryContext(1L, 2L, null, "When is my next appointment?")));
  }

  @Test
  void routesStructuredFactsWithoutRag() {
    assertEquals(
        AiQueryMode.HEALTH_RECORD,
        router.route(new AiQueryContext(1L, null, null, "When is my next appointment?")));
  }

  @Test
  void routesTerminologyToKnowledge() {
    assertEquals(
        AiQueryMode.MEDICAL_KNOWLEDGE,
        router.route(new AiQueryContext(1L, null, null, "What does ferritin mean?")));
  }

  @Test
  void usesControlledFallback() {
    assertEquals(AiQueryMode.GENERAL, router.route(new AiQueryContext(1L, null, null, "Hello")));
  }
}
