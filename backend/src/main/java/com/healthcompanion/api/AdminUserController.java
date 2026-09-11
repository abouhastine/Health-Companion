package com.healthcompanion.api;

import com.healthcompanion.domain.Role;
import com.healthcompanion.domain.User;
import com.healthcompanion.repository.AiAuditEventRepository;
import com.healthcompanion.repository.AiConversationRepository;
import com.healthcompanion.repository.AppointmentRepository;
import com.healthcompanion.repository.MedicalDocumentRepository;
import com.healthcompanion.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Administrative account lifecycle. Password hashes are never returned by these endpoints. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository documents;
  private final AiConversationRepository conversations;
  private final AiAuditEventRepository auditEvents;

  public AdminUserController(
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

  @GetMapping
  public List<UserResponse> list() {
    return users.findAll().stream().map(UserResponse::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
    var email = normalizedEmail(request.email());
    ensureEmailAvailable(email, null);
    var user = new User();
    apply(user, request.firstName(), request.lastName(), email, request.phone(), request.role());
    user.passwordHash = passwords.encode(request.password());
    return UserResponse.from(users.save(user));
  }

  @PutMapping("/{id}")
  public UserResponse update(
      Authentication authentication,
      @PathVariable Long id,
      @Valid @RequestBody UpdateUserRequest request) {
    var user = user(id);
    var actorId = (Long) authentication.getPrincipal();
    if (actorId.equals(user.id) && request.role() != user.role)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot change your own role");
    if (user.role == Role.ADMIN
        && request.role() != Role.ADMIN
        && users.countByRole(Role.ADMIN) <= 1)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one administrator is required");
    apply(user, request.firstName(), request.lastName(), user.email, request.phone(), request.role());
    if (request.password() != null && !request.password().isBlank())
      user.passwordHash = passwords.encode(request.password());
    return UserResponse.from(users.save(user));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication authentication, @PathVariable Long id) {
    var user = user(id);
    if (user.id.equals(authentication.getPrincipal()))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot delete your own account");
    if (user.role == Role.ADMIN && users.countByRole(Role.ADMIN) <= 1)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one administrator is required");
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

  private User user(Long id) {
    return users
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private void ensureEmailAvailable(String email, Long currentId) {
    users
        .findByEmailIgnoreCase(email)
        .filter(existing -> !existing.id.equals(currentId))
        .ifPresent(
            ignored -> {
              throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            });
  }

  private static String normalizedEmail(String email) {
    return email.trim().toLowerCase();
  }

  private static void apply(
      User user, String firstName, String lastName, String email, String phone, Role role) {
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = email;
    user.phone = phone == null || phone.isBlank() ? null : phone.trim();
    user.role = role;
  }

  public record CreateUserRequest(
      @NotBlank @Size(max = 100) String firstName,
      @NotBlank @Size(max = 100) String lastName,
      @NotBlank @Email @Size(max = 255) String email,
      @Size(max = 50) String phone,
      @NotBlank @Size(min = 8, max = 100) String password,
      @NotNull Role role) {}

  public record UpdateUserRequest(
      @NotBlank @Size(max = 100) String firstName,
      @NotBlank @Size(max = 100) String lastName,
      @Size(max = 50) String phone,
      @Pattern(regexp = "^$|.{8,100}$", message = "Password must be at least 8 characters")
          String password,
      @NotNull Role role) {}
}
