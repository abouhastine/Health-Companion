package com.healthcompanion.api;

import com.healthcompanion.domain.Role;
import com.healthcompanion.domain.User;
import com.healthcompanion.repository.UserRepository;
import com.healthcompanion.security.MobileSessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Mobile-only session endpoints. The established browser auth contract remains in AuthController. */
@RestController
@RequestMapping("/api/auth/mobile")
public class MobileAuthController {
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final MobileSessionService sessions;

  public MobileAuthController(
      UserRepository users, PasswordEncoder passwords, MobileSessionService sessions) {
    this.users = users;
    this.passwords = passwords;
    this.sessions = sessions;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public MobileAuthResponse register(@Valid @RequestBody MobileRegisterRequest request) {
    if (users.findByEmailIgnoreCase(request.email()).isPresent())
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    if (!request.password().equals(request.confirmPassword()))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
    var user = new User();
    user.firstName = request.firstName();
    user.lastName = request.lastName();
    user.email = request.email().toLowerCase();
    user.phone = request.phone();
    user.passwordHash = passwords.encode(request.password());
    user.role = Role.PATIENT;
    return response(users.save(user), request.platform(), request.deviceName());
  }

  @PostMapping("/login")
  public MobileAuthResponse login(@Valid @RequestBody MobileLoginRequest request) {
    var user =
        users
            .findByEmailIgnoreCase(request.email())
            .filter(value -> passwords.matches(request.password(), value.passwordHash))
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (user.role != Role.PATIENT)
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mobile beta is available to patients only");
    return response(user, request.platform(), request.deviceName());
  }

  @PostMapping("/refresh")
  public MobileSessionService.Tokens refresh(@Valid @RequestBody RefreshRequest request) {
    return sessions.rotate(request.refreshToken());
  }

  @PostMapping("/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void logout(@Valid @RequestBody RefreshRequest request) {
    sessions.revoke(request.refreshToken());
  }

  private MobileAuthResponse response(User user, String platform, String deviceName) {
    return new MobileAuthResponse(
        sessions.create(user, platform, deviceName),
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.role);
  }

  public record MobileRegisterRequest(
      @NotBlank @Size(max = 100) String firstName,
      @NotBlank @Size(max = 100) String lastName,
      @NotBlank @Email @Size(max = 255) String email,
      @Size(max = 50) String phone,
      @NotBlank @Size(min = 8, max = 100) String password,
      @NotBlank @Size(max = 100) String confirmPassword,
      @NotBlank @Pattern(regexp = "IOS|ANDROID") String platform,
      @Size(max = 120) String deviceName) {}

  public record MobileLoginRequest(
      @NotBlank @Email @Size(max = 255) String email,
      @NotBlank String password,
      @NotBlank @Pattern(regexp = "IOS|ANDROID") String platform,
      @Size(max = 120) String deviceName) {}

  public record RefreshRequest(@NotBlank @Size(max = 200) String refreshToken) {}

  public record MobileAuthResponse(
      MobileSessionService.Tokens session,
      Long id,
      String firstName,
      String lastName,
      String email,
      Role role) {}
}
