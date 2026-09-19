package com.healthcompanion.api;

import com.healthcompanion.documents.LocalDocumentStorage;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
  private final MedicalDocumentRepository docs;
  private final LocalDocumentStorage storage;

  public DocumentController(MedicalDocumentRepository d, LocalDocumentStorage s) {
    docs = d;
    storage = s;
  }

  @GetMapping("/me")
  public List<DocumentResponse> mine(Authentication a) {
    return docs.findByPatientIdOrderByDocumentDateDesc((Long) a.getPrincipal()).stream()
        .map(DocumentResponse::from)
        .toList();
  }

  @GetMapping("/{id}")
  public DocumentResponse one(Authentication a, @PathVariable Long id) {
    return DocumentResponse.from(owned(a, id));
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<byte[]> download(Authentication a, @PathVariable Long id)
      throws IOException {
    var d = owned(a, id);
    var r = storage.load(d.storagePath);
    var filename = pdfFilename(d.title);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString())
        .body(r.bytes());
  }

  private String pdfFilename(String title) {
    var safeTitle = title.replaceAll("[\\\\/:*?\\\"<>|\\r\\n]+", "_").trim();
    if (safeTitle.isBlank()) safeTitle = "medical-result";
    return safeTitle.toLowerCase(Locale.ROOT).endsWith(".pdf") ? safeTitle : safeTitle + ".pdf";
  }

  private MedicalDocument owned(Authentication a, Long id) {
    return docs.findByIdAndPatientId(id, (Long) a.getPrincipal())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }
}
