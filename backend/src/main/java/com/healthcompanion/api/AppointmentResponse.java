package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import java.time.Instant;
import java.time.LocalDateTime;

public record AppointmentResponse(
    Long id,
    UserSummary patient,
    PractitionerSummary practitioner,
    SlotSummary slot,
    String reason,
    AppointmentStatus status,
    Instant createdAt) {
  public static AppointmentResponse from(Appointment appointment) {
    return new AppointmentResponse(
        appointment.id,
        UserSummary.from(appointment.patient),
        PractitionerSummary.from(appointment.practitioner),
        SlotSummary.from(appointment.slot),
        appointment.reason,
        appointment.status,
        appointment.createdAt);
  }

  public record UserSummary(
      Long id, String firstName, String lastName, String email, String phone, Role role) {
    static UserSummary from(User user) {
      return new UserSummary(
          user.id, user.firstName, user.lastName, user.email, user.phone, user.role);
    }
  }

  public record PractitionerSummary(
      Long id,
      String firstName,
      String lastName,
      String specialty,
      String organization,
      String address,
      String languages) {
    static PractitionerSummary from(Practitioner practitioner) {
      return new PractitionerSummary(
          practitioner.id,
          practitioner.firstName,
          practitioner.lastName,
          practitioner.specialty,
          practitioner.organization,
          practitioner.address,
          practitioner.languages);
    }
  }

  public record SlotSummary(
      Long id, LocalDateTime startAt, LocalDateTime endAt, boolean available) {
    static SlotSummary from(AppointmentSlot slot) {
      return new SlotSummary(slot.id, slot.startAt, slot.endAt, slot.available);
    }
  }
}
