package com.healthcompanion.domain;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="appointments") public class Appointment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @ManyToOne(optional=false) @JoinColumn(name="patient_id") public User patient;
 @ManyToOne(optional=false) @JoinColumn(name="practitioner_id") public Practitioner practitioner; @OneToOne(optional=false) @JoinColumn(name="appointment_slot_id") public AppointmentSlot slot;
 public String reason; @Enumerated(EnumType.STRING) public AppointmentStatus status=AppointmentStatus.CONFIRMED; @Column(name="created_at") public Instant createdAt=Instant.now();
}
