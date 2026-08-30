package com.healthcompanion.ai;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentRagService {
  private final MedicalDocumentRepository documents;
  private final DocumentChunkRepository chunks;
  private final EmbeddingGateway embeddings;
  private final PgVectorStore vectors;
  private final int topK;

  public DocumentRagService(
      MedicalDocumentRepository d,
      DocumentChunkRepository c,
      EmbeddingGateway e,
      PgVectorStore v,
      @Value("${app.ai.top-k:4}") int topK) {
    documents = d;
    chunks = c;
    embeddings = e;
    vectors = v;
    this.topK = topK;
  }

  public Result retrieve(long patientId, long documentId, String question) {
    var d =
        documents
            .findByIdAndPatientId(documentId, patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (d.status != DocumentStatus.AVAILABLE)
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "The document is not available for AI retrieval");
    var ids =
        vectors.nearestDocumentChunks(
            documentId, embeddings.embed(question), embeddings.profile(), topK);
    var byId = new HashMap<Long, DocumentChunk>();
    chunks.findByDocumentIdOrderByChunkIndex(documentId).forEach(c -> byId.put(c.id, c));
    var selected = ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    if (selected.isEmpty())
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "No compatible document index is available; ask an administrator to re-index it");
    return new Result(d, selected);
  }

  public record Result(MedicalDocument document, List<DocumentChunk> chunks) {
    public String context() {
      return chunks.stream().map(c -> c.content).reduce("", (a, b) -> a + "\n" + b);
    }
  }
}
