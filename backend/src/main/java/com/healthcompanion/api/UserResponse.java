package com.healthcompanion.api;

import com.healthcompanion.domain.Role;
import com.healthcompanion.domain.User;

public record UserResponse(
    Long id, String firstName, String lastName, String email, String phone, Role role) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.id, user.firstName, user.lastName, user.email, user.phone, user.role);
  }
}
