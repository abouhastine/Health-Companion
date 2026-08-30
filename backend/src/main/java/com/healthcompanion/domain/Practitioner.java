package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practitioners")
public class Practitioner {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "first_name")
  public String firstName;

  @Column(name = "last_name")
  public String lastName;

  public String specialty, organization, address, languages;
  @Transient public LocalDateTime nextAvailableAt;
}
