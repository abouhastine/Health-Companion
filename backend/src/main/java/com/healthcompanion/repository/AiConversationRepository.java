package com.healthcompanion.repository;

import com.healthcompanion.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
  boolean existsByPatientId(Long patientId);

  Optional<AiConversation> findByIdAndPatientId(Long id, Long patientId);
}
