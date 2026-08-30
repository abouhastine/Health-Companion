package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
  private final AppointmentRepository appointments;
  private final AppointmentSlotRepository slots;
  private final UserRepository users;

  public AppointmentController(
      AppointmentRepository a, AppointmentSlotRepository s, UserRepository u) {
    appointments = a;
    slots = s;
    users = u;
  }

  @GetMapping("/me")
  public List<Appointment> mine(Authentication auth) {
    return appointments.findByPatientIdOrderBySlotStartAtDesc((Long) auth.getPrincipal());
  }

  @PostMapping
  @Transactional
  @ResponseStatus(HttpStatus.CREATED)
  public Appointment book(Authentication auth, @RequestBody Booking r) {
    var slot =
        slots
            .lockById(r.slotId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (!slot.available)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Slot is no longer available");
    if (!slot.startAt.isAfter(LocalDateTime.now()))
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Appointments can only be booked in the future");
    var a = new Appointment();
    a.patient = users.getReferenceById((Long) auth.getPrincipal());
    a.practitioner = slot.practitioner;
    a.slot = slot;
    a.reason = r.reason();
    slot.available = false;
    return appointments.save(a);
  }

  @DeleteMapping("/{id}")
  @Transactional
  public void cancel(Authentication auth, @PathVariable Long id) {
    var a =
        appointments
            .findById(id)
            .filter(x -> x.patient.id.equals(auth.getPrincipal()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (a.status != AppointmentStatus.CONFIRMED || !a.slot.startAt.isAfter(LocalDateTime.now()))
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Only future confirmed appointments can be cancelled");
    a.status = AppointmentStatus.CANCELLED;
    a.slot.available = true;
  }

  public record Booking(Long slotId, String reason) {}
}
