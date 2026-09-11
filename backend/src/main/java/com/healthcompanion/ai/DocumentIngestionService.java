package com.healthcompanion.ai;

import com.healthcompanion.documents.LocalDocumentStorage;
import com.healthcompanion.domain.DocumentChunk;
import com.healthcompanion.domain.MedicalDocument;
import com.healthcompanion.repository.DocumentChunkRepository;
import java.io.IOException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentIngestionService {
  private static final int CHUNK_SIZE = 3_000;
  private static final int CHUNK_STEP = 2_400;
  private final LocalDocumentStorage storage;
  private final DocumentChunkRepository chunks;
  private final EmbeddingGateway embeddings;
  private final PgVectorStore vectors;

  public DocumentIngestionService(
      LocalDocumentStorage storage,
      DocumentChunkRepository chunks,
      EmbeddingGateway embeddings,
      PgVectorStore vectors) {
    this.storage = storage;
    this.chunks = chunks;
    this.embeddings = embeddings;
    this.vectors = vectors;
  }

  @Transactional
  public void ingest(MedicalDocument document) throws IOException {
    chunks.deleteByDocumentId(document.id);
    chunks.flush();
    try (var pdf = Loader.loadPDF(storage.load(document.storagePath).bytes())) {
      var stripper = new PDFTextStripper();
      var chunkIndex = 0;
      for (var page = 1; page <= pdf.getNumberOfPages(); page++) {
        stripper.setStartPage(page);
        stripper.setEndPage(page);
        chunkIndex = storePageChunks(document, page, chunkIndex, stripper.getText(pdf));
      }
      if (chunkIndex == 0)
        throw new IOException("The PDF does not contain extractable text for RAG indexing");
    }
  }

  private int storePageChunks(MedicalDocument document, int page, int nextChunkIndex, String text) {
    text = text.trim();
    if (text.isEmpty()) return nextChunkIndex;
    for (var from = 0; from < text.length(); from += CHUNK_STEP) {
      var chunk = new DocumentChunk();
      chunk.document = document;
      chunk.page = page;
      chunk.chunkIndex = nextChunkIndex++;
      chunk.content = text.substring(from, Math.min(from + CHUNK_SIZE, text.length()));
      chunk.embeddingProfile = embeddings.profile();
      var embedding = embeddings.embed(chunk.content);
      chunk.embeddingDimension = embedding.length;
      chunk = chunks.save(chunk);
      vectors.storeDocumentEmbedding(
          chunk.id, embedding, chunk.embeddingProfile);
    }
    return nextChunkIndex;
  }
}
