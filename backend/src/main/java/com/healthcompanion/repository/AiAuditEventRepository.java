package com.healthcompanion.repository;

import com.healthcompanion.domain.AiAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAuditEventRepository extends JpaRepository<AiAuditEvent, Long> {
  boolean existsByPatientId(Long patientId);

  void deleteByConversationId(Long conversationId);
}
