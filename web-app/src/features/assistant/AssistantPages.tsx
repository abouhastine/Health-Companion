import { useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call, streamChat } from '../../services/apiClient';
import type { Chat } from '../../types/domain';

type AssistantPageProps = {
  documentId?: number;
};

type Message = {
  role: string;
  text: string;
  response?: Chat['response'];
};

export function AssistantPage({ documentId }: AssistantPageProps) {
  const [question, setQuestion] = useState(
    documentId ? 'Explain this result in simple terms.' : 'What is my next appointment?',
  );
  const [conversationId, setConversationId] = useState<number>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    const asked = question;
    setAsking(true);
    setError('');
    try {
      if (documentId) {
        setMessages((previous) => [
          ...previous,
          { role: 'You', text: asked },
          { role: 'Health Companion', text: '' },
        ]);
        const result = await streamChat(
          `/api/ai/documents/${documentId}/chat/stream`,
          { question: asked, conversationId },
          (chunk) =>
            setMessages((previous) => {
              const copy = [...previous];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                text: copy[copy.length - 1].text + chunk,
              };
              return copy;
            }),
        );
        setConversationId(result.conversationId);
        setMessages((previous) => {
          const copy = [...previous];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            text: result.response.answer,
            response: result.response,
          };
          return copy;
        });
      } else {
        const result = await call<Chat>('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ question: asked, documentId, conversationId }),
        });
        setConversationId(result.conversationId);
        setMessages((previous) => [
          ...previous,
          { role: 'You', text: asked },
          { role: 'Health Companion', text: result.response.answer, response: result.response },
        ]);
      }
      setQuestion('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to reach the assistant.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <AppShell>
      <Typography variant="h4">
        {documentId ? 'Ask about this result' : 'Health assistant'}
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Health information only — not a diagnosis or treatment recommendation.
      </Typography>
      <Stack spacing={2}>
        {messages.map((message, index) => (
          <Paper
            key={index}
            sx={{ p: 2, bgcolor: message.role === 'You' ? 'grey.100' : 'background.paper' }}
          >
            <Typography variant="subtitle2">{message.role}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
            {message.response?.safetyBlocked ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                This request or generated response crossed the assistant’s medical-safety boundary.
              </Alert>
            ) : null}
            {message.response?.generalKnowledgeNotice && (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                This is general education and is not based on your medical record.
              </Typography>
            )}
            {message.response?.sources.map((source, sourceIndex) => (
              <Typography key={sourceIndex} variant="caption" display="block">
                Source: {source.title}
                {source.page ? ` · p. ${source.page}` : ''}
                {source.scope === 'MEDICAL_KNOWLEDGE' ? ' · approved knowledge' : ''}
              </Typography>
            ))}
          </Paper>
        ))}
        <TextField
          multiline
          minRows={3}
          label="Your question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <ErrorMessage message={error} />
        <Button variant="contained" disabled={asking} onClick={ask}>
          {asking ? 'Thinking…' : 'Ask assistant'}
        </Button>
      </Stack>
    </AppShell>
  );
}

export function DocumentAssistantPage() {
  const { id } = useParams();
  return <AssistantPage documentId={Number(id)} />;
}
