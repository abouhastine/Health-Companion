package com.healthcompanion.repository;

import com.healthcompanion.domain.User;
import com.healthcompanion.domain.Role;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmailIgnoreCase(String email);

  long countByRole(Role role);
}
