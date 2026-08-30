package com.healthcompanion.repository;

import com.healthcompanion.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {
  List<AppointmentSlot> findByPractitionerIdAndAvailableTrueOrderByStartAt(Long practitionerId);

  List<AppointmentSlot> findByPractitionerIdOrderByStartAt(Long practitionerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from AppointmentSlot s where s.id=:id")
  Optional<AppointmentSlot> lockById(Long id);
}
