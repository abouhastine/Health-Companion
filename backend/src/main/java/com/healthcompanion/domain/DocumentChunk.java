package com.healthcompanion.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "document_chunks")
public class DocumentChunk {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne
  @JoinColumn(name = "document_id")
  public MedicalDocument document;

  @Column(name = "chunk_index")
  public int chunkIndex;

  public Integer page;

  @Column(columnDefinition = "TEXT")
  public String content;

  @Column(name = "embedding_profile")
  public String embeddingProfile;

  @Column(name = "rag_scope")
  public String ragScope = "PATIENT_DOCUMENT";
}
