package com.healthcompanion.repository;

import com.healthcompanion.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {
  boolean existsByPatientId(Long patientId);

  List<MedicalDocument> findByPatientIdOrderByDocumentDateDesc(Long patientId);

  Optional<MedicalDocument> findByIdAndPatientId(Long id, Long patientId);
}
