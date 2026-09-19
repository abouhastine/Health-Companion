package com.healthcompanion.security;

import com.healthcompanion.domain.MobileSession;
import com.healthcompanion.domain.User;
import com.healthcompanion.repository.MobileSessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class MobileSessionService {
  private final MobileSessionRepository sessions;
  private final JwtService jwt;
  private final long accessExpirationMinutes;
  private final long refreshExpirationDays;
  private final SecureRandom random = new SecureRandom();

  public MobileSessionService(
      MobileSessionRepository sessions,
      JwtService jwt,
      @Value("${app.mobile-session.access-expiration-minutes}") long accessExpirationMinutes,
      @Value("${app.mobile-session.refresh-expiration-days}") long refreshExpirationDays) {
    this.sessions = sessions;
    this.jwt = jwt;
    this.accessExpirationMinutes = accessExpirationMinutes;
    this.refreshExpirationDays = refreshExpirationDays;
  }

  @Transactional
  public Tokens create(User user, String platform, String deviceName) {
    var refresh = newRefreshToken();
    var session = new MobileSession();
    session.user = user;
    session.refreshTokenHash = hash(refresh);
    session.platform = platform;
    session.deviceName = deviceName;
    session.expiresAt = Instant.now().plus(Duration.ofDays(refreshExpirationDays));
    sessions.save(session);
    return tokens(user, refresh);
  }

  @Transactional
  public Tokens rotate(String rawRefreshToken) {
    var session = valid(rawRefreshToken);
    session.revokedAt = Instant.now();
    return create(session.user, session.platform, session.deviceName);
  }

  @Transactional
  public void revoke(String rawRefreshToken) {
    var session = sessions.findByRefreshTokenHash(hash(rawRefreshToken)).orElse(null);
    if (session != null && session.revokedAt == null) session.revokedAt = Instant.now();
  }

  private MobileSession valid(String rawRefreshToken) {
    var session =
        sessions
            .findByRefreshTokenHash(hash(rawRefreshToken))
            .orElseThrow(() -> unauthorized("Invalid mobile session"));
    if (session.revokedAt != null || !session.expiresAt.isAfter(Instant.now()))
      throw unauthorized("Mobile session has expired or was revoked");
    return session;
  }

  private Tokens tokens(User user, String refresh) {
    return new Tokens(jwt.issueMobile(user, accessExpirationMinutes), refresh, accessExpirationMinutes * 60);
  }

  private String newRefreshToken() {
    byte[] bytes = new byte[48];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String token) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }

  private ResponseStatusException unauthorized(String message) {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
  }

  public record Tokens(String accessToken, String refreshToken, long expiresInSeconds) {}
}
