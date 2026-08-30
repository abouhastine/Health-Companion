package com.healthcompanion.ai;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PgVectorStore {
  private final JdbcTemplate jdbc;

  public PgVectorStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void storeDocumentEmbedding(long chunkId, float[] values, String profile) {
    jdbc.update(
        "update document_chunks set embedding=cast(? as vector), embedding_profile=? where id=?",
        vector(values),
        profile,
        chunkId);
  }

  public void storeKnowledgeEmbedding(long chunkId, float[] values, String profile) {
    jdbc.update(
        "update knowledge_chunks set embedding=cast(? as vector), embedding_profile=? where id=?",
        vector(values),
        profile,
        chunkId);
  }

  public List<Long> nearestDocumentChunks(
      long documentId, float[] values, String profile, int limit) {
    return jdbc.queryForList(
        "select id from document_chunks where document_id=? and embedding_profile=? and embedding is not null order by embedding <=> cast(? as vector) limit ?",
        Long.class,
        documentId,
        profile,
        vector(values),
        limit);
  }

  public List<Long> nearestKnowledgeChunks(float[] values, String profile, int limit) {
    return jdbc.queryForList(
        "select id from knowledge_chunks where embedding_profile=? and embedding is not null order by embedding <=> cast(? as vector) limit ?",
        Long.class,
        profile,
        vector(values),
        limit);
  }

  private String vector(float[] v) {
    var b = new StringBuilder("[");
    for (int i = 0; i < v.length; i++) {
      if (i > 0) b.append(',');
      b.append(v[i]);
    }
    return b.append(']').toString();
  }
}
