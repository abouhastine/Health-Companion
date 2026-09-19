package com.healthcompanion.api;

import com.healthcompanion.ai.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
  private final HealthAssistantService assistant;
  private final ConversationService conversations;
  private final AiSafetyService safety;
  private final AiAuditService audit;

  public AiChatController(
      HealthAssistantService a, ConversationService c, AiSafetyService s, AiAuditService x) {
    assistant = a;
    conversations = c;
    safety = s;
    audit = x;
  }

  @PostMapping("/chat")
  public ChatResponse chat(Authentication auth, @Valid @RequestBody ChatRequest r) {
    return answer((Long) auth.getPrincipal(), r);
  }

  private ChatResponse answer(long patient, ChatRequest r) {
    var c = conversations.resolve(patient, r.conversationId());
    var blocked = safety.safeQuestion(r.question());
    var answer =
        blocked == null
            ? assistant.answer(
                new AiQueryContext(r.question(), conversations.promptHistory(patient, c.id)))
            : new HealthAssistantService.AiResponse(blocked, true);
    conversations.add(c, "USER", r.question());
    conversations.add(c, "ASSISTANT", answer.answer());
    audit.record(patient, c, blocked != null || answer.safetyBlocked());
    return new ChatResponse(c.id, answer);
  }

  @GetMapping("/conversations/{id}")
  public Object history(Authentication auth, @PathVariable long id) {
    return conversations.history((Long) auth.getPrincipal(), id);
  }

  @DeleteMapping("/conversations/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void deleteConversation(Authentication auth, @PathVariable long id) {
    conversations.delete((Long) auth.getPrincipal(), id);
  }

  public record ChatRequest(
      @NotBlank @Size(max = 4000) String question, @Positive Long conversationId) {}

  public record ChatResponse(Long conversationId, HealthAssistantService.AiResponse response) {}
}
