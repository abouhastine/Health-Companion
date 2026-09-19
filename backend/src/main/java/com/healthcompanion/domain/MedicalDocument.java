package com.healthcompanion.domain;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "medical_documents")
public class MedicalDocument {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "patient_id")
  public User patient;

  @ManyToOne
  @JoinColumn(name = "practitioner_id")
  public Practitioner practitioner;

  public String title;

  @Enumerated(EnumType.STRING)
  @Column(name = "document_type")
  public DocumentType documentType;

  @Column(name = "document_date")
  public LocalDate documentDate;

  @Column(name = "storage_path")
  public String storagePath;

  @Column(name = "mime_type")
  public String mimeType;

  @Column(name = "created_at")
  public Instant createdAt = Instant.now();

}
