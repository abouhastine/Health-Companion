package com.healthcompanion.ai;

import com.healthcompanion.domain.KnowledgeChunk;
import com.healthcompanion.repository.KnowledgeChunkRepository;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MedicalKnowledgeRagService {
  private final KnowledgeChunkRepository chunks;
  private final EmbeddingGateway embeddings;
  private final PgVectorStore vectors;
  private final int topK;

  public MedicalKnowledgeRagService(
      KnowledgeChunkRepository c,
      EmbeddingGateway e,
      PgVectorStore v,
      @Value("${app.ai.top-k:4}") int topK) {
    chunks = c;
    embeddings = e;
    vectors = v;
    this.topK = topK;
  }

  public Result retrieve(String question) {
    var byId = new HashMap<Long, KnowledgeChunk>();
    chunks.findAll().forEach(c -> byId.put(c.id, c));
    var selected =
        vectors.nearestKnowledgeChunks(embeddings.embed(question), embeddings.profile(), topK)
            .stream()
            .map(byId::get)
            .filter(Objects::nonNull)
            .toList();
    return new Result(selected);
  }

  public record Result(List<KnowledgeChunk> chunks) {
    public String context() {
      return chunks.stream().map(c -> c.content).reduce("", (a, b) -> a + "\n" + b);
    }
  }
}
