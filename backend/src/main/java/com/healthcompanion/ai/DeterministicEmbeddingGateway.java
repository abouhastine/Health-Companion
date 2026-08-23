package com.healthcompanion.ai;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean; import org.springframework.context.annotation.*;
@Configuration public class DeterministicEmbeddingGateway { @Bean @ConditionalOnMissingBean(EmbeddingGateway.class) EmbeddingGateway gateway(){return new EmbeddingGateway(){public float[] embed(String text){var v=new float[768];for(var t:text.toLowerCase().split("\\W+"))v[Math.floorMod(t.hashCode(),768)]++;return v;}public String profile(){return "deterministic-test-768";}};} }
