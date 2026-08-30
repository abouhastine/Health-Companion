package com.healthcompanion.config;

import com.healthcompanion.ai.MedicalKnowledgeIngestionService;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.time.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DemoSeedData {
  @Bean
  CommandLineRunner seed(
      PractitionerRepository practitioners,
      AppointmentSlotRepository slots,
      UserRepository users,
      PasswordEncoder passwords,
      KnowledgeChunkRepository knowledge,
      MedicalKnowledgeIngestionService ingestion) {
    return args -> {
      if (users.findByEmailIgnoreCase("admin@health-companion.demo").isEmpty()) {
        var u = new User();
        u.firstName = "Demo";
        u.lastName = "Admin";
        u.email = "admin@health-companion.demo";
        u.passwordHash = passwords.encode("DemoPassword1!");
        u.role = com.healthcompanion.domain.Role.ADMIN;
        users.save(u);
      }
      if (practitioners.count() == 0) {
        var p = new Practitioner();
        p.firstName = "Sonia";
        p.lastName = "Ben Salem";
        p.specialty = "General practice";
        p.organization = "Health Companion Clinic";
        p = practitioners.save(p);
        for (int i = 1; i <= 3; i++) {
          var s = new AppointmentSlot();
          s.practitioner = p;
          s.startAt = LocalDateTime.now().plusDays(i).withHour(10).withMinute(0);
          s.endAt = s.startAt.plusMinutes(30);
          slots.save(s);
        }
      }
      if (knowledge.count() == 0)
        ingestion.ingest(
            "Health Companion demo knowledge",
            "Ferritin",
            "en",
            "1",
            "Ferritin is a protein that stores iron. Interpret a result together with the laboratory reference range and a healthcare professional; this does not establish a diagnosis.");
    };
  }
}
