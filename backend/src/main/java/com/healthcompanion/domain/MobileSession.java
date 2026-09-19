package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "mobile_sessions")
public class MobileSession {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  public User user;

  @Column(name = "refresh_token_hash", nullable = false, unique = true, length = 64)
  public String refreshTokenHash;

  @Column(nullable = false, length = 20)
  public String platform;

  @Column(name = "device_name", length = 120)
  public String deviceName;

  @Column(name = "expires_at", nullable = false)
  public Instant expiresAt;

  @Column(name = "revoked_at")
  public Instant revokedAt;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();
}
