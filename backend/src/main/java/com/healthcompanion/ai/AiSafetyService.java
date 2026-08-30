package com.healthcompanion.ai;

import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AiSafetyService {
  public static final String SAFETY_RESPONSE =
      "The assistant cannot diagnose, prescribe, recommend treatment, or change medication. "
          + "It can explain factual values and suggest questions to discuss with a healthcare professional.";

  private static final List<String> BLOCKED =
      List.of(
          "diagnose",
          "diagnosis",
          "diagnostic",
          "do i have",
          "have i got",
          "is this cancer",
          "do i suffer",
          "what disease",
          "prescribe",
          "prescription",
          "treatment plan",
          "medication change",
          "should i take",
          "should i stop",
          "diagnostiquer",
          "est-ce que j'ai",
          "ai-je",
          "prescrire",
          "traitement",
          "médicament");

  public String safeQuestion(String question) {
    var q = question == null ? "" : question.toLowerCase(Locale.ROOT);
    if (BLOCKED.stream().anyMatch(q::contains))
      return SAFETY_RESPONSE;
    return null;
  }

  public boolean unsafeAnswer(String answer) {
    var value = answer == null ? "" : answer.toLowerCase(Locale.ROOT);
    return List.of(
            "you have ",
            "you likely have",
            "this confirms",
            "this means you have",
            "i diagnose",
            "you should take",
            "you should stop",
            "you should start",
            "i recommend taking",
            "increase your dose",
            "decrease your dose",
            "vous avez ",
            "vous devriez prendre",
            "arrêtez de prendre",
            "commencez à prendre")
        .stream()
        .anyMatch(value::contains);
  }
}
