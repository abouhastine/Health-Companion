package com.healthcompanion.ai;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class AiSafetyServiceTest {
  private final AiSafetyService safety = new AiSafetyService();

  @Test
  void blocksDiagnosis() {
    assertNotNull(safety.safeQuestion("Can you diagnose me?"));
  }

  @Test
  void blocksImplicitDiagnosis() {
    assertNotNull(safety.safeQuestion("Do I have iron deficiency?"));
  }

  @Test
  void allowsExplanation() {
    assertNull(safety.safeQuestion("What does ferritin mean?"));
  }

  @Test
  void rejectsUnsafeGeneratedAdvice() {
    assertTrue(safety.unsafeAnswer("You should take a higher dose immediately."));
  }

  @Test
  void allowsGroundedRangeExplanation() {
    assertFalse(
        safety.unsafeAnswer(
            "The report shows ferritin below its printed range; this does not establish a diagnosis."));
  }
}
