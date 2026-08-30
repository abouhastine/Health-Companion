package com.healthcompanion.repository;

import com.healthcompanion.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
  List<Appointment> findByPatientIdOrderBySlotStartAtDesc(Long patientId);
}
