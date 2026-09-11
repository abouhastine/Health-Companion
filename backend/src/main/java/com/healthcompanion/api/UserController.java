package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.AiAuditEventRepository;
import com.healthcompanion.repository.AiConversationRepository;
import com.healthcompanion.repository.AppointmentRepository;
import com.healthcompanion.repository.MedicalDocumentRepository;
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
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository documents;
  private final AiConversationRepository conversations;
  private final AiAuditEventRepository auditEvents;

  public UserController(
      UserRepository users,
      PasswordEncoder passwords,
      AppointmentRepository appointments,
      MedicalDocumentRepository documents,
      AiConversationRepository conversations,
      AiAuditEventRepository auditEvents) {
    this.users = users;
    this.passwords = passwords;
    this.appointments = appointments;
    this.documents = documents;
    this.conversations = conversations;
    this.auditEvents = auditEvents;
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
    if (hasRelatedData(user.id)) throw accountDeletionBlocked();
    try {
      users.delete(user);
      users.flush();
    } catch (DataIntegrityViolationException exception) {
      throw accountDeletionBlocked(exception);
    }
  }

  private boolean hasRelatedData(Long userId) {
    return appointments.existsByPatientId(userId)
        || documents.existsByPatientId(userId)
        || conversations.existsByPatientId(userId)
        || auditEvents.existsByPatientId(userId);
  }

  private ResponseStatusException accountDeletionBlocked() {
    return accountDeletionBlocked(null);
  }

  private ResponseStatusException accountDeletionBlocked(Exception cause) {
    return new ResponseStatusException(
        HttpStatus.CONFLICT,
        "This account has health records, appointments, or chat history and cannot be deleted",
        cause);
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
