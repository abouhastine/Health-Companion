package com.healthcompanion.repository;

import com.healthcompanion.domain.MobileSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MobileSessionRepository extends JpaRepository<MobileSession, Long> {
  Optional<MobileSession> findByRefreshTokenHash(String refreshTokenHash);
}
