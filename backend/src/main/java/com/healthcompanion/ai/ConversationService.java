package com.healthcompanion.ai;

import com.healthcompanion.domain.AiConversation;
import com.healthcompanion.domain.AiMessage;
import com.healthcompanion.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConversationService {
  private final AiConversationRepository conversations;
  private final AiMessageRepository messages;
  private final AiAuditEventRepository auditEvents;
  private final UserRepository users;

  public ConversationService(
      AiConversationRepository c,
      AiMessageRepository m,
      AiAuditEventRepository a,
      UserRepository u) {
    conversations = c;
    messages = m;
    auditEvents = a;
    users = u;
  }

  public AiConversation resolve(long patientId, Long conversationId) {
    if (conversationId != null) {
      var c =
          conversations
              .findByIdAndPatientId(conversationId, patientId)
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
      return c;
    }
    var c = new AiConversation();
    c.patient = users.getReferenceById(patientId);
    return conversations.save(c);
  }

  public void add(AiConversation c, String role, String content) {
    var m = new AiMessage();
    m.conversation = c;
    m.role = role;
    m.content = content;
    messages.save(m);
  }

  public java.util.List<AiMessage> history(long patientId, long id) {
    resolve(patientId, id);
    return messages.findByConversationIdOrderByCreatedAt(id);
  }

  public String promptHistory(long patientId, long id) {
    var all = history(patientId, id);
    var from = Math.max(0, all.size() - 8);
    return all.subList(from, all.size()).stream()
        .map(m -> m.role + ": " + m.content)
        .reduce("", (a, b) -> a + "\n" + b);
  }

  @org.springframework.transaction.annotation.Transactional
  public void delete(long patientId, long id) {
    var conversation = resolve(patientId, id);
    auditEvents.deleteByConversationId(conversation.id);
    conversations.delete(conversation);
  }
}
