package com.healthcompanion.api;

import com.healthcompanion.ai.DocumentIngestionService;
import com.healthcompanion.documents.LocalDocumentStorage;
import com.healthcompanion.domain.*;
import com.healthcompanion.repository.*;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final PractitionerRepository practitioners;
  private final AppointmentSlotRepository slots;
  private final UserRepository users;
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository docs;
  private final LocalDocumentStorage storage;
  private final DocumentIngestionService ingestion;

  public AdminController(
      PractitionerRepository practitioners,
      AppointmentSlotRepository slots,
      UserRepository users,
      AppointmentRepository appointments,
      MedicalDocumentRepository docs,
      LocalDocumentStorage storage,
      DocumentIngestionService ingestion) {
    this.practitioners = practitioners;
    this.slots = slots;
    this.users = users;
    this.appointments = appointments;
    this.docs = docs;
    this.storage = storage;
    this.ingestion = ingestion;
  }

  @GetMapping("/patients")
  public List<User> patients() {
    return users.findAll().stream().filter(user -> user.role == Role.PATIENT).toList();
  }

  @GetMapping("/appointments")
  public List<Appointment> appointments() {
    return appointments.findAll();
  }

  @GetMapping("/practitioners")
  public List<Practitioner> practitionerList() {
    return practitioners.findAll();
  }

  @PostMapping("/practitioners")
  @ResponseStatus(HttpStatus.CREATED)
  public Practitioner create(@RequestBody Practitioner practitioner) {
    return practitioners.save(practitioner);
  }

  @PutMapping("/practitioners/{id}")
  public Practitioner update(@PathVariable Long id, @RequestBody Practitioner practitioner) {
    if (!practitioners.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    practitioner.id = id;
    return practitioners.save(practitioner);
  }

  @DeleteMapping("/practitioners/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    practitioners.deleteById(id);
  }

  @GetMapping("/practitioners/{id}/slots")
  public List<AppointmentSlot> practitionerSlots(@PathVariable Long id) {
    if (!practitioners.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return slots.findByPractitionerIdOrderByStartAt(id);
  }

  @PostMapping("/practitioners/{id}/slots")
  @ResponseStatus(HttpStatus.CREATED)
  public AppointmentSlot createSlot(@PathVariable Long id, @RequestBody SlotRequest request) {
    var slot = new AppointmentSlot();
    slot.practitioner =
        practitioners
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(slot, request);
    return slots.save(slot);
  }

  @PutMapping("/slots/{id}")
  public AppointmentSlot updateSlot(@PathVariable Long id, @RequestBody SlotRequest request) {
    var slot =
        slots.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(slot, request);
    return slots.save(slot);
  }

  @DeleteMapping("/slots/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSlot(@PathVariable Long id) {
    slots.deleteById(id);
  }

  @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public MedicalDocument upload(
      @RequestParam Long patientId,
      @RequestParam DocumentType documentType,
      @RequestParam String title,
      @RequestParam String documentDate,
      @RequestParam(required = false) Long practitionerId,
      @RequestPart MultipartFile file)
      throws IOException {
    if (!MediaType.APPLICATION_PDF_VALUE.equals(file.getContentType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF documents are supported");
    }
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
    document.documentDate = LocalDate.parse(documentDate);
    document.mimeType = file.getContentType();
    document.storagePath = storage.save(file);
    document = docs.save(document);
    ingestion.ingest(document);
    return document;
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

  public record SlotRequest(LocalDateTime startAt, LocalDateTime endAt, Boolean available) {}
}
