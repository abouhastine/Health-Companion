package com.healthcompanion.ai;

public record AiQueryContext(
    Long patientId,
    Long documentId,
    Long conversationId,
    String question,
    String conversationHistory) {
  public AiQueryContext(Long patientId, Long documentId, Long conversationId, String question) {
    this(patientId, documentId, conversationId, question, "");
  }
}
