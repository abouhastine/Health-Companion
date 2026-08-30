package com.healthcompanion.repository;

import com.healthcompanion.domain.*;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
  @EntityGraph(attributePaths = {"patient", "practitioner", "slot"})
  List<Appointment> findByPatientIdOrderBySlotStartAtDesc(Long patientId);

  @EntityGraph(attributePaths = {"patient", "practitioner", "slot"})
  @Query("select a from Appointment a order by a.slot.startAt desc")
  List<Appointment> findAllWithDetails();

  @Modifying
  @Query(
      "update Appointment a set a.status = com.healthcompanion.domain.AppointmentStatus.COMPLETED "
          + "where a.status = com.healthcompanion.domain.AppointmentStatus.CONFIRMED "
          + "and a.slot.endAt <= :now")
  int completePastAppointments(LocalDateTime now);
}
