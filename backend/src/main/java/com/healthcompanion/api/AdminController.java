package com.healthcompanion.api;

import com.healthcompanion.ai.DocumentIngestionService;
import com.healthcompanion.appointments.AppointmentLifecycleService;
import com.healthcompanion.documents.LocalDocumentStorage;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {
  private final PractitionerRepository practitioners;
  private final AppointmentSlotRepository slots;
  private final UserRepository users;
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository docs;
  private final LocalDocumentStorage storage;
  private final DocumentIngestionService ingestion;
  private final AppointmentLifecycleService lifecycle;

  public AdminController(
      PractitionerRepository practitioners,
      AppointmentSlotRepository slots,
      UserRepository users,
      AppointmentRepository appointments,
      MedicalDocumentRepository docs,
      LocalDocumentStorage storage,
      DocumentIngestionService ingestion,
      AppointmentLifecycleService lifecycle) {
    this.practitioners = practitioners;
    this.slots = slots;
    this.users = users;
    this.appointments = appointments;
    this.docs = docs;
    this.storage = storage;
    this.ingestion = ingestion;
    this.lifecycle = lifecycle;
  }

  @GetMapping("/patients")
  public List<User> patients() {
    return users.findAll().stream().filter(user -> user.role == Role.PATIENT).toList();
  }

  @GetMapping("/appointments")
  public List<AppointmentResponse> appointments() {
    lifecycle.completePastAppointments();
    return appointments.findAllWithDetails().stream().map(AppointmentResponse::from).toList();
  }

  @GetMapping("/practitioners")
  public List<Practitioner> practitionerList() {
    return practitioners.findAll();
  }

  @PostMapping("/practitioners")
  @ResponseStatus(HttpStatus.CREATED)
  public Practitioner create(@Valid @RequestBody PractitionerRequest request) {
    return practitioners.save(request.apply(new Practitioner()));
  }

  @PutMapping("/practitioners/{id}")
  public Practitioner update(
      @PathVariable Long id, @Valid @RequestBody PractitionerRequest request) {
    var practitioner =
        practitioners
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return practitioners.save(request.apply(practitioner));
  }

  @DeleteMapping("/practitioners/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    if (!practitioners.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    try {
      practitioners.deleteById(id);
      practitioners.flush();
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Practitioner is referenced by existing records", exception);
    }
  }

  @GetMapping("/practitioners/{id}/slots")
  public List<AppointmentSlot> practitionerSlots(@PathVariable Long id) {
    if (!practitioners.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return slots.findByPractitionerIdOrderByStartAt(id);
  }

  @PostMapping("/practitioners/{id}/slots")
  @ResponseStatus(HttpStatus.CREATED)
  public AppointmentSlot createSlot(
      @PathVariable Long id, @Valid @RequestBody SlotRequest request) {
    var slot = new AppointmentSlot();
    slot.practitioner =
        practitioners
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(slot, request);
    return slots.save(slot);
  }

  @PutMapping("/slots/{id}")
  public AppointmentSlot updateSlot(
      @PathVariable Long id, @Valid @RequestBody SlotRequest request) {
    var slot =
        slots.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(slot, request);
    return slots.save(slot);
  }

  @DeleteMapping("/slots/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSlot(@PathVariable Long id) {
    if (!slots.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    try {
      slots.deleteById(id);
      slots.flush();
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Slot is referenced by an appointment", exception);
    }
  }

  @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public DocumentResponse upload(
      @RequestParam @Positive Long patientId,
      @RequestParam DocumentType documentType,
      @RequestParam @NotBlank @Size(max = 255) String title,
      @RequestParam @PastOrPresent LocalDate documentDate,
      @RequestParam(required = false) Long practitionerId,
      @RequestPart("file") MultipartFile file)
      throws IOException {
    validatePdf(file);
    var document = new MedicalDocument();
    document.patient =
        users
            .findById(patientId)
            .filter(user -> user.role == Role.PATIENT)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    document.practitioner =
        practitionerId == null
            ? null
            : practitioners
                .findById(practitionerId)
                .orElseThrow(
                    () ->
                        new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Practitioner not found"));
    document.title = title;
    document.documentType = documentType;
    document.documentDate = documentDate;
    document.mimeType = file.getContentType();
    document.storagePath = storage.save(file);
    document = docs.save(document);
    return ingest(document);
  }

  @PostMapping("/documents/{id}/reindex")
  public DocumentResponse reindex(@PathVariable Long id) {
    var document =
        docs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    document.status = DocumentStatus.PROCESSING;
    docs.save(document);
    return ingest(document);
  }

  private DocumentResponse ingest(MedicalDocument document) {
    try {
      ingestion.ingest(document);
      document.status = DocumentStatus.AVAILABLE;
      return DocumentResponse.from(docs.save(document));
    } catch (Exception exception) {
      document.status = DocumentStatus.FAILED;
      docs.save(document);
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY, "Document indexing failed", exception);
    }
  }

  private void validatePdf(MultipartFile file) throws IOException {
    if (file.isEmpty() || !MediaType.APPLICATION_PDF_VALUE.equals(file.getContentType()))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A non-empty PDF is required");
    try (InputStream input = file.getInputStream()) {
      if (!new String(input.readNBytes(5), java.nio.charset.StandardCharsets.US_ASCII)
          .equals("%PDF-"))
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "The uploaded file is not a valid PDF");
    }
  }

  private void apply(AppointmentSlot slot, SlotRequest request) {
    if (request.startAt() == null
        || request.endAt() == null
        || !request.endAt().isAfter(request.startAt())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Slot end time must be after its start time");
    }
    slot.startAt = request.startAt();
    slot.endAt = request.endAt();
    if (request.available() != null) slot.available = request.available();
  }

  public record SlotRequest(
      @NotNull LocalDateTime startAt, @NotNull LocalDateTime endAt, Boolean available) {}

  public record PractitionerRequest(
      @NotBlank @Size(max = 100) String firstName,
      @NotBlank @Size(max = 100) String lastName,
      @NotBlank @Size(max = 150) String specialty,
      @NotBlank @Size(max = 200) String organization,
      @Size(max = 300) String address,
      @Size(max = 300) String languages) {
    Practitioner apply(Practitioner practitioner) {
      practitioner.firstName = firstName;
      practitioner.lastName = lastName;
      practitioner.specialty = specialty;
      practitioner.organization = organization;
      practitioner.address = address;
      practitioner.languages = languages;
      return practitioner;
    }
  }
}
