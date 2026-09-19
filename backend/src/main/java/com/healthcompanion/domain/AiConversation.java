package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "ai_conversations")
public class AiConversation {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne
  @JoinColumn(name = "patient_id")
  public User patient;

  @Column(name = "created_at")
  public Instant createdAt = Instant.now();
}
