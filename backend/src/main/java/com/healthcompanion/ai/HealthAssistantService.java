package com.healthcompanion.ai;

import com.healthcompanion.domain.*;
import com.healthcompanion.repository.AppointmentRepository;
import com.healthcompanion.repository.MedicalDocumentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class HealthAssistantService {
  private static final String LIMITATION =
      "This information does not establish a diagnosis or treatment plan. A healthcare professional can interpret it with your symptoms, history, and other results.";
  private final AiQueryRouter router;
  private final DocumentRagService documents;
  private final MedicalKnowledgeRagService knowledge;
  private final AppointmentRepository appointments;
  private final MedicalDocumentRepository medicalDocuments;
  private final LlmGateway llm;

  public HealthAssistantService(
      AiQueryRouter router,
      DocumentRagService documents,
      MedicalKnowledgeRagService knowledge,
      AppointmentRepository appointments,
      MedicalDocumentRepository medicalDocuments,
      LlmGateway llm) {
    this.router = router;
    this.documents = documents;
    this.knowledge = knowledge;
    this.appointments = appointments;
    this.medicalDocuments = medicalDocuments;
    this.llm = llm;
  }

  public AiResponse answer(AiQueryContext request) {
    return switch (router.route(request)) {
      case DOCUMENT_CONTEXT -> document(request);
      case HEALTH_RECORD -> record(request);
      case MEDICAL_KNOWLEDGE -> knowledge(request);
      case GENERAL -> general(request);
    };
  }

  private AiResponse document(AiQueryContext request) {
    var result = documents.retrieve(request.patientId(), request.documentId(), request.question());
    var answer =
        llm.generate(
            "Use only retrieved facts. Explain in plain language. Never diagnose, prescribe, recommend treatment, or change medication.",
            withHistory(result.context(), request),
            request.question());
    return new AiResponse(
        AiQueryMode.DOCUMENT_CONTEXT,
        structured("From Your Result", answer),
        result.chunks().stream()
            .map(
                c ->
                    new AiSource(
                        result.document().id, result.document().title, c.page, "PATIENT_DOCUMENT"))
            .toList(),
        false);
  }

  public AiResponse streamDocument(
      AiQueryContext request, java.util.function.Consumer<String> onToken) {
    var result = documents.retrieve(request.patientId(), request.documentId(), request.question());
    var heading = "From Your Result\n";
    onToken.accept(heading);
    var answer = new StringBuilder(heading);
    llm.generateStream(
        "Use only retrieved facts. Explain in plain language. Never diagnose, prescribe, recommend treatment, or change medication.",
        withHistory(result.context(), request),
        request.question(),
        token -> {
          answer.append(token);
          onToken.accept(token);
        });
    var limitation = "\n\nWhat the AI Cannot Determine\n" + LIMITATION;
    answer.append(limitation);
    onToken.accept(limitation);
    return new AiResponse(
        AiQueryMode.DOCUMENT_CONTEXT,
        answer.toString(),
        result.chunks().stream()
            .map(
                c ->
                    new AiSource(
                        result.document().id, result.document().title, c.page, "PATIENT_DOCUMENT"))
            .toList(),
        false);
  }

  private AiResponse record(AiQueryContext request) {
    var question = request.question().toLowerCase();
    String facts;
    if (question.contains("result") || question.contains("résultat") || question.contains("exam")) {
      facts =
          medicalDocuments.findByPatientIdOrderByDocumentDateDesc(request.patientId()).stream()
              .findFirst()
              .map(
                  d ->
                      "Latest medical result: "
                          + d.title
                          + " ("
                          + d.documentType
                          + ", "
                          + d.documentDate
                          + ").")
              .orElse("No medical results found.");
    } else {
      facts =
          appointments.findByPatientIdOrderBySlotStartAtDesc(request.patientId()).stream()
              .filter(
                  a ->
                      a.status == AppointmentStatus.CONFIRMED
                          && a.slot.startAt.isAfter(LocalDateTime.now()))
              .min(java.util.Comparator.comparing(a -> a.slot.startAt))
              .map(
                  a ->
                      "Next appointment: Dr. "
                          + a.practitioner.lastName
                          + " at "
                          + a.slot.startAt
                          + ".")
              .orElse("No future confirmed appointments found.");
    }
    return new AiResponse(
        AiQueryMode.HEALTH_RECORD,
        llm.generate(
            "Format only these supplied facts. Do not add clinical advice.",
            withHistory(facts, request),
            request.question()),
        List.of(),
        false);
  }

  private AiResponse knowledge(AiQueryContext request) {
    var answer =
        llm.generate(
            "Educational information only; no diagnosis or treatment advice.",
            withHistory(knowledge.retrieve(request.question()), request),
            request.question());
    return new AiResponse(
        AiQueryMode.MEDICAL_KNOWLEDGE,
        structured("General Explanation", answer),
        List.of(new AiSource(null, "Approved medical knowledge", null, "MEDICAL_KNOWLEDGE")),
        false);
  }

  private AiResponse general(AiQueryContext request) {
    return new AiResponse(
        AiQueryMode.GENERAL,
        structured(
            "General Explanation",
            llm.generate(
                "General education only; no diagnosis or treatment.",
                withHistory("", request),
                request.question())),
        List.of(),
        true);
  }

  private String withHistory(String context, AiQueryContext request) {
    return context
        + "\nPrevious conversation (use only for continuity):\n"
        + request.conversationHistory();
  }

  private String structured(String heading, String answer) {
    return heading + "\n" + answer + "\n\nWhat the AI Cannot Determine\n" + LIMITATION;
  }

  public record AiResponse(
      AiQueryMode mode, String answer, List<AiSource> sources, boolean generalKnowledgeNotice) {}

  public record AiSource(Long documentId, String title, Integer page, String scope) {}
}
