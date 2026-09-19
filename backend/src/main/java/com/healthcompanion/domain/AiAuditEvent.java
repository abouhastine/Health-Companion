package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "ai_audit_events")
public class AiAuditEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne
  @JoinColumn(name = "patient_id")
  public User patient;

  @ManyToOne
  @JoinColumn(name = "conversation_id")
  public AiConversation conversation;

  public String provider;

  @Column(name = "safety_blocked")
  public boolean safetyBlocked;

  @Column(name = "created_at")
  public Instant createdAt = Instant.now();
}
