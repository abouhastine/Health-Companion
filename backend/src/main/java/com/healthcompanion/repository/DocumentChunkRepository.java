package com.healthcompanion.repository;

import com.healthcompanion.domain.DocumentChunk;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
  List<DocumentChunk> findByDocumentIdOrderByChunkIndex(Long documentId);

  void deleteByDocumentId(Long documentId);
}
