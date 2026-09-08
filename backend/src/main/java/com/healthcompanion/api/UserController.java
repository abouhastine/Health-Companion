package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserRepository users;
  private final PasswordEncoder passwords;

  public UserController(UserRepository users, PasswordEncoder passwords) {
    this.users = users;
    this.passwords = passwords;
  }

  @GetMapping("/me")
  public UserResponse me(Authentication authentication) {
    return UserResponse.from(current(authentication));
  }

  @PutMapping("/me")
  public UserResponse update(Authentication authentication, @Valid @RequestBody ProfileRequest request) {
    var user = current(authentication);
    user.firstName = request.firstName();
    user.lastName = request.lastName();
    user.phone = request.phone();
    if (request.password() != null && !request.password().isBlank())
      user.passwordHash = passwords.encode(request.password());
    return UserResponse.from(users.save(user));
  }

  @DeleteMapping("/me")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication authentication) {
    var user = current(authentication);
    if (user.role == Role.ADMIN)
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Administrators must be deleted by another administrator");
    try {
      users.delete(user);
      users.flush();
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "This account has health records or appointments and cannot be deleted",
          exception);
    }
  }

  private User current(Authentication authentication) {
    return users
        .findById((Long) authentication.getPrincipal())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  public record ProfileRequest(
      @NotBlank @Size(max = 100) String firstName,
      @NotBlank @Size(max = 100) String lastName,
      @Size(max = 50) String phone,
      @Pattern(regexp = "^$|.{8,100}$", message = "Password must be at least 8 characters")
          String password) {}
}
