package com.healthcompanion.ai;

import com.healthcompanion.domain.AiQueryMode;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class DeterministicAiQueryRouter implements AiQueryRouter {
  private static final List<String> RECORD =
      List.of(
          "appointment",
          "rendez-vous",
          "rendez vous",
          "next appointment",
          "appointments",
          "latest result",
          "latest medical result",
          "dernier résultat",
          "dernier resultat",
          "mes examens",
          "pending exam",
          "examens en attente",
          "my results",
          "this week",
          "cette semaine");
  private static final List<String> KNOWLEDGE =
      List.of(
          "what is",
          "what does",
          "que signifie",
          "qu'est-ce que",
          "ferritin",
          "ferritine",
          "hemoglobin",
          "hémoglobine",
          "reference range",
          "valeur de référence",
          "mri",
          "irm",
          "hyperintense",
          "ct scan");

  public AiQueryMode route(AiQueryContext c) {
    if (c.documentId() != null) return AiQueryMode.DOCUMENT_CONTEXT;
    String q = Optional.ofNullable(c.question()).orElse("").toLowerCase(Locale.ROOT);
    if (RECORD.stream().anyMatch(q::contains)) return AiQueryMode.HEALTH_RECORD;
    if (KNOWLEDGE.stream().anyMatch(q::contains)) return AiQueryMode.MEDICAL_KNOWLEDGE;
    return AiQueryMode.GENERAL;
  }
}
