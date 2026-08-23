package com.healthcompanion.ai;
import org.springframework.context.annotation.*; import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
@Configuration public class UnavailableLlmGateway { @Bean @ConditionalOnMissingBean(LlmGateway.class) LlmGateway unavailable(){return (instruction,context,question)->"AI provider is not configured. Configure the Ollama or OpenAI gateway before testing AI responses.";} }
