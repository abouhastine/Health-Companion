package com.healthcompanion.config;

import com.healthcompanion.ai.MedicalKnowledgeIngestionService;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.time.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("demo")
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
        var general =
            savePractitioner(
                practitioners,
                "Sonia",
                "Ben Salem",
                "General practice",
                "Health Companion Clinic",
                "12 Avenue de la Santé, Paris",
                "French, English, Arabic");
        var cardiologist =
            savePractitioner(
                practitioners,
                "Karim",
                "Mansouri",
                "Cardiology",
                "Health Companion Heart Center",
                "8 Rue du Cœur, Paris",
                "French, English");
        seedSlots(slots, general, 10);
        seedSlots(slots, cardiologist, 14);
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

  private static Practitioner savePractitioner(
      PractitionerRepository practitioners,
      String firstName,
      String lastName,
      String specialty,
      String organization,
      String address,
      String languages) {
    var practitioner = new Practitioner();
    practitioner.firstName = firstName;
    practitioner.lastName = lastName;
    practitioner.specialty = specialty;
    practitioner.organization = organization;
    practitioner.address = address;
    practitioner.languages = languages;
    return practitioners.save(practitioner);
  }

  private static void seedSlots(
      AppointmentSlotRepository slots, Practitioner practitioner, int hour) {
    for (int day = 1; day <= 3; day++) {
      var slot = new AppointmentSlot();
      slot.practitioner = practitioner;
      slot.startAt =
          LocalDateTime.now().plusDays(day).withHour(hour).withMinute(0).withSecond(0).withNano(0);
      slot.endAt = slot.startAt.plusMinutes(30);
      slots.save(slot);
    }
  }
}
