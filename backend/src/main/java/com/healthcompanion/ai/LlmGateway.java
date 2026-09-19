package com.healthcompanion.ai;

public interface LlmGateway {
  String generate(String systemInstruction, String context, String question);
}
