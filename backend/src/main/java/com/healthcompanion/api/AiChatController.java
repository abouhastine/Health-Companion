package com.healthcompanion.api;

import com.healthcompanion.ai.*;
import com.healthcompanion.domain.AiQueryMode;
import java.io.IOException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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
  public ChatResponse chat(Authentication auth, @RequestBody ChatRequest r) {
    return answer((Long) auth.getPrincipal(), r);
  }

  @PostMapping(
      value = "/documents/{documentId}/chat/stream",
      produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(
      Authentication auth, @PathVariable long documentId, @RequestBody ChatRequest r) {
    var patient = (Long) auth.getPrincipal();
    var emitter = new SseEmitter(0L);
    java.util.concurrent.CompletableFuture.runAsync(
        () -> {
          try {
            var c = conversations.resolve(patient, r.conversationId(), documentId);
            var blocked = safety.safeQuestion(r.question());
            HealthAssistantService.AiResponse answer;
            if (blocked != null) {
              emitter.send(SseEmitter.event().name("token").data(blocked));
              answer =
                  new HealthAssistantService.AiResponse(
                      AiQueryMode.GENERAL, blocked, List.of(), true);
            } else
              answer =
                  assistant.streamDocument(
                      new AiQueryContext(
                          patient,
                          c.document.id,
                          c.id,
                          r.question(),
                          conversations.promptHistory(patient, c.id)),
                      token -> {
                        try {
                          emitter.send(SseEmitter.event().name("token").data(token));
                        } catch (IOException exception) {
                          throw new IllegalStateException(exception);
                        }
                      });
            conversations.add(c, "USER", r.question(), answer.mode());
            conversations.add(c, "ASSISTANT", answer.answer(), answer.mode());
            audit.record(patient, c, answer.mode(), blocked != null);
            emitter.send(SseEmitter.event().name("complete").data(new ChatResponse(c.id, answer)));
            emitter.complete();
          } catch (Exception exception) {
            emitter.completeWithError(exception);
          }
        });
    return emitter;
  }

  private ChatResponse answer(long patient, ChatRequest r) {
    var c = conversations.resolve(patient, r.conversationId(), r.documentId());
    var documentId = c.document == null ? null : c.document.id;
    var blocked = safety.safeQuestion(r.question());
    var answer =
        blocked == null
            ? assistant.answer(
                new AiQueryContext(
                    patient,
                    documentId,
                    c.id,
                    r.question(),
                    conversations.promptHistory(patient, c.id)))
            : new HealthAssistantService.AiResponse(AiQueryMode.GENERAL, blocked, List.of(), true);
    conversations.add(c, "USER", r.question(), answer.mode());
    conversations.add(c, "ASSISTANT", answer.answer(), answer.mode());
    audit.record(patient, c, answer.mode(), blocked != null);
    return new ChatResponse(c.id, answer);
  }

  @GetMapping("/conversations/{id}")
  public Object history(Authentication auth, @PathVariable long id) {
    return conversations.history((Long) auth.getPrincipal(), id);
  }

  public record ChatRequest(String question, Long documentId, Long conversationId) {}

  public record ChatResponse(Long conversationId, HealthAssistantService.AiResponse response) {}
}
