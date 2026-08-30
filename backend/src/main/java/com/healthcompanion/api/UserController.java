package com.healthcompanion.api;

import com.healthcompanion.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserRepository users;

  public UserController(UserRepository u) {
    users = u;
  }

  @GetMapping("/me")
  public Object me(Authentication a) {
    return users
        .findById((Long) a.getPrincipal())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }
}
