package com.healthcompanion.ai;

import com.healthcompanion.domain.AiQueryMode;

public interface AiQueryRouter {
  AiQueryMode route(AiQueryContext context);
}
