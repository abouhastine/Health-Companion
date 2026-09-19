package com.healthcompanion.ai;

import org.springframework.stereotype.Service;

@Service
public class HealthAssistantService {
  private final LlmGateway llm;
  private final AiSafetyService safety;

  public HealthAssistantService(LlmGateway llm, AiSafetyService safety) {
    this.llm = llm;
    this.safety = safety;
  }

  public AiResponse answer(AiQueryContext request) {
    var answer =
        llm.generate(
            "Provide general health education only. Do not diagnose, prescribe, recommend "
                + "treatment, or change medication. Do not claim access to the user's health record.",
            withHistory(request),
            request.question());
    return safety.unsafeAnswer(answer)
        ? new AiResponse(AiSafetyService.SAFETY_RESPONSE, true)
        : new AiResponse(answer, false);
  }

  private String withHistory(AiQueryContext request) {
    return "Previous conversation (use only for continuity):\n" + request.conversationHistory();
  }

  public record AiResponse(String answer, boolean safetyBlocked) {}
}
