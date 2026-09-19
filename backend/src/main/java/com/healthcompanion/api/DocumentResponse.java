package com.healthcompanion.api;

import com.healthcompanion.domain.*;
import java.time.Instant;
import java.time.LocalDate;

public record DocumentResponse(
    Long id,
    String title,
    DocumentType documentType,
    LocalDate documentDate,
    PractitionerSummary practitioner,
    Instant createdAt) {
  public static DocumentResponse from(MedicalDocument document) {
    return new DocumentResponse(
        document.id,
        document.title,
        document.documentType,
        document.documentDate,
        PractitionerSummary.from(document.practitioner), document.createdAt);
  }

  public record PractitionerSummary(
      Long id,
      String firstName,
      String lastName,
      String specialty,
      String organization,
      String address,
      String languages) {
    static PractitionerSummary from(Practitioner practitioner) {
      if (practitioner == null) return null;
      return new PractitionerSummary(
          practitioner.id,
          practitioner.firstName,
          practitioner.lastName,
          practitioner.specialty,
          practitioner.organization,
          practitioner.address,
          practitioner.languages);
    }
  }
}
