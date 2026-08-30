package com.healthcompanion.repository;

import com.healthcompanion.domain.Practitioner;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PractitionerRepository extends JpaRepository<Practitioner, Long> {}
