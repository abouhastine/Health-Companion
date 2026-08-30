package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_slots")
public class AppointmentSlot {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "practitioner_id")
  public Practitioner practitioner;

  @Column(name = "start_at")
  public LocalDateTime startAt;

  @Column(name = "end_at")
  public LocalDateTime endAt;

  public boolean available = true;
}
