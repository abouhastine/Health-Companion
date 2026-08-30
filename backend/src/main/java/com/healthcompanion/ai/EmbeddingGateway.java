package com.healthcompanion.ai;

public interface EmbeddingGateway {
  float[] embed(String text);

  String profile();
}
