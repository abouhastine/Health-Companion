package com.healthcompanion.security;

import com.healthcompanion.domain.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expiration;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-minutes}") long expiration) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  public String issue(User user) {
    return Jwts.builder()
        .subject(user.id.toString())
        .claim("role", user.role.name())
        .issuedAt(new Date())
        .expiration(Date.from(Instant.now().plus(Duration.ofMinutes(expiration))))
        .signWith(key)
        .compact();
  }

  public Long userId(String token) {
    return Long.valueOf(
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject());
  }
}
