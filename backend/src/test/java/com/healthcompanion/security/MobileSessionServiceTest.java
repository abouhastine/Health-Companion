package com.healthcompanion.security;

import static org.junit.jupiter.api.Assertions.*;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.MobileSessionRepository;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class MobileSessionServiceTest {
  @Test
  void createsHashedRefreshSessionAndShortLivedAccessToken() {
    var store = new Store();
    var result = service(store).create(patient(), "IOS", "iPhone");

    assertEquals(900, result.expiresInSeconds());
    assertFalse(result.accessToken().isBlank());
    assertEquals(1, store.saved.size());
    assertNotEquals(result.refreshToken(), store.saved.getFirst().refreshTokenHash);
    assertEquals(64, store.saved.getFirst().refreshTokenHash.length());
    assertEquals("IOS", store.saved.getFirst().platform);
  }

  @Test
  void rotatesValidRefreshTokenAndRevokesTheOldSession() {
    var store = new Store();
    var service = service(store);
    var first = service.create(patient(), "ANDROID", "Pixel");
    var original = store.saved.getFirst();

    var next = service.rotate(first.refreshToken());

    assertNotNull(original.revokedAt);
    assertNotEquals(first.refreshToken(), next.refreshToken());
    assertEquals(2, store.saved.size());
    assertEquals("ANDROID", store.saved.getLast().platform);
  }

  @Test
  void rejectsExpiredOrRevokedRefreshTokens() {
    var store = new Store();
    var service = service(store);
    var issued = service.create(patient(), "IOS", "iPhone");
    store.saved.getFirst().expiresAt = Instant.now().minusSeconds(1);

    var failure = assertThrows(ResponseStatusException.class, () -> service.rotate(issued.refreshToken()));

    assertEquals(401, failure.getStatusCode().value());
    assertEquals(1, store.saved.size());
  }

  @Test
  void revokeIsIdempotentAndNeverPersistsRawTokens() {
    var store = new Store();
    var service = service(store);
    var issued = service.create(patient(), "IOS", "iPhone");

    service.revoke(issued.refreshToken());
    service.revoke(issued.refreshToken());

    assertNotNull(store.saved.getFirst().revokedAt);
    assertTrue(store.saved.stream().noneMatch(value -> issued.refreshToken().equals(value.refreshTokenHash)));
  }

  private MobileSessionService service(Store store) {
    return new MobileSessionService(
        store.repository(),
        new JwtService("a-very-long-test-secret-that-is-at-least-32-bytes", 480),
        15,
        30);
  }

  private User patient() {
    var user = new User();
    user.id = 7L;
    user.role = Role.PATIENT;
    return user;
  }

  private static class Store {
    final List<MobileSession> saved = new ArrayList<>();
    final Map<String, MobileSession> byHash = new HashMap<>();

    MobileSessionRepository repository() {
      return (MobileSessionRepository)
          Proxy.newProxyInstance(
              getClass().getClassLoader(),
              new Class<?>[] {MobileSessionRepository.class},
              (proxy, method, args) -> {
                if (method.getName().equals("save")) {
                  var value = (MobileSession) args[0];
                  if (!saved.contains(value)) saved.add(value);
                  byHash.put(value.refreshTokenHash, value);
                  return value;
                }
                if (method.getName().equals("findByRefreshTokenHash"))
                  return Optional.ofNullable(byHash.get(args[0]));
                if (method.getName().equals("toString")) return "MobileSessionRepository test store";
                throw new UnsupportedOperationException(method.getName());
              });
    }
  }
}
