package com.healthcompanion.api;

import com.healthcompanion.documents.LocalDocumentStorage;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.io.*;
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
  public List<MedicalDocument> mine(Authentication a) {
    return docs.findByPatientIdOrderByDocumentDateDesc((Long) a.getPrincipal());
  }

  @GetMapping("/{id}")
  public MedicalDocument one(Authentication a, @PathVariable Long id) {
    return owned(a, id);
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<byte[]> download(Authentication a, @PathVariable Long id)
      throws IOException {
    var d = owned(a, id);
    var r = storage.load(d.storagePath);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + d.title + ".pdf\"")
        .body(r.bytes());
  }

  private MedicalDocument owned(Authentication a, Long id) {
    return docs.findByIdAndPatientId(id, (Long) a.getPrincipal())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }
}
