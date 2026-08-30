package com.healthcompanion.ai;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiAuditService {
  private final AiAuditEventRepository events;
  private final UserRepository users;
  private final String provider;

  public AiAuditService(
      AiAuditEventRepository e, UserRepository u, @Value("${app.ai.chat-provider}") String p) {
    events = e;
    users = u;
    provider = p;
  }

  public void record(
      long patientId, AiConversation conversation, AiQueryMode mode, boolean blocked) {
    var event = new AiAuditEvent();
    event.patient = users.getReferenceById(patientId);
    event.conversation = conversation;
    event.mode = mode;
    event.provider = provider;
    event.safetyBlocked = blocked;
    events.save(event);
  }
}
