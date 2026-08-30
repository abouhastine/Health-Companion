package com.healthcompanion.ai;

import java.util.function.Consumer;

public interface LlmGateway {
  String generate(String systemInstruction, String context, String question);

  default void generateStream(
      String systemInstruction, String context, String question, Consumer<String> onToken) {
    onToken.accept(generate(systemInstruction, context, question));
  }
}
