package com.healthcompanion.appointments;

import com.healthcompanion.repository.AppointmentRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentLifecycleService {
  private final AppointmentRepository appointments;

  public AppointmentLifecycleService(AppointmentRepository appointments) {
    this.appointments = appointments;
  }

  @Transactional
  public void completePastAppointments() {
    appointments.completePastAppointments(LocalDateTime.now());
  }
}
