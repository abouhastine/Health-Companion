package com.healthcompanion.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "knowledge_chunks")
public class KnowledgeChunk {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String source, topic, language, version;

  @Column(name = "chunk_index")
  public int chunkIndex;

  @Column(columnDefinition = "TEXT")
  public String content;

  @Column(name = "embedding_profile")
  public String embeddingProfile;

  @Column(name = "embedding_dimension")
  public Integer embeddingDimension;

  @Column(name = "rag_scope")
  public String ragScope = "MEDICAL_KNOWLEDGE";
}
