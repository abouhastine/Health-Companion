package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/practitioners")
public class PractitionerController {
  private final PractitionerRepository practitioners;
  private final AppointmentSlotRepository slots;

  public PractitionerController(PractitionerRepository p, AppointmentSlotRepository s) {
    practitioners = p;
    slots = s;
  }

  @GetMapping
  public List<Practitioner> list() {
    return practitioners.findAll().stream().peek(this::addNextAvailable).toList();
  }

  @GetMapping("/{id}")
  public Practitioner one(@PathVariable Long id) {
    var practitioner =
        practitioners
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    addNextAvailable(practitioner);
    return practitioner;
  }

  @GetMapping("/{id}/slots")
  public List<AppointmentSlot> slots(@PathVariable Long id) {
    one(id);
    return slots.findByPractitionerIdAndAvailableTrueAndStartAtAfterOrderByStartAt(
        id, LocalDateTime.now());
  }

  private void addNextAvailable(Practitioner practitioner) {
    practitioner.nextAvailableAt =
        slots
            .findByPractitionerIdAndAvailableTrueAndStartAtAfterOrderByStartAt(
                practitioner.id, LocalDateTime.now())
            .stream()
            .findFirst()
            .map(slot -> slot.startAt)
            .orElse(null);
  }
}
