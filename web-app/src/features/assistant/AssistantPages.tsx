import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesomeOutlined, SendRounded, VerifiedUserOutlined } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, SectionCard } from '../../components/ui';
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
  const [notice, setNotice] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingConversation, setClearingConversation] = useState(false);

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

  const clearConversation = async () => {
    if (!conversationId) return;
    setClearingConversation(true);
    try {
      await call(`/api/ai/conversations/${conversationId}`, { method: 'DELETE' });
      setConversationId(undefined);
      setMessages([]);
      setNotice('Conversation cleared.');
      setClearDialogOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to clear this conversation.');
    } finally {
      setClearingConversation(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={documentId ? 'Selected medical result' : 'Health information'}
        title={documentId ? 'Ask about this result' : 'Health assistant'}
        description={
          documentId
            ? 'Get a clear explanation grounded in the pages of this result.'
            : 'Ask about appointments, your health record or general medical terminology.'
        }
        action={
          <Chip
            icon={<VerifiedUserOutlined />}
            label="Information, not diagnosis"
            color="primary"
            variant="outlined"
          />
        }
      />
      {notice ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>
          {notice}
        </Alert>
      ) : null}
      <SectionCard sx={{ bgcolor: 'rgba(255,255,255,.84)' }}>
        <Stack spacing={2.25}>
          {messages.length === 0 ? (
            <Box sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
              <AutoAwesomeOutlined color="primary" sx={{ fontSize: 38 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                How can I help?
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {documentId
                  ? 'Try “Explain this result in simple terms.”'
                  : 'Try “What is my next appointment?” or “What does ferritin mean?”'}
              </Typography>
            </Box>
          ) : null}
          {messages.map((message, index) => (
            <Paper
              key={index}
              sx={{
                p: 2.25,
                ml: message.role === 'You' ? { sm: 8 } : 0,
                mr: message.role === 'You' ? 0 : { sm: 8 },
                bgcolor: message.role === 'You' ? 'primary.light' : 'background.paper',
                borderColor: message.role === 'You' ? 'transparent' : undefined,
              }}
            >
              <Typography color="text.secondary" variant="overline" fontWeight={800}>
                {message.role}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.text || 'Thinking…'}</Typography>
              {message.response?.safetyBlocked ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  This request or generated response crossed the assistant’s medical-safety
                  boundary.
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1}
          >
            <Typography variant="caption" color="text.secondary">
              Health information only. Speak to a practitioner for medical decisions.
            </Typography>
            <Stack direction="row" spacing={1}>
              {conversationId ? (
                <Button color="inherit" disabled={asking} onClick={() => setClearDialogOpen(true)}>
                  Clear chat
                </Button>
              ) : null}
              <Button variant="contained" disabled={asking} onClick={ask} endIcon={<SendRounded />}>
                {asking ? 'Thinking…' : 'Ask assistant'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </SectionCard>
      <Dialog
        open={clearDialogOpen}
        onClose={() => !clearingConversation && setClearDialogOpen(false)}
      >
        <DialogTitle>Clear this conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes the messages in this chat and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setClearDialogOpen(false)} disabled={clearingConversation}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void clearConversation()}
            disabled={clearingConversation}
          >
            {clearingConversation ? 'Clearing…' : 'Clear chat'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}

export function DocumentAssistantPage() {
  const { id } = useParams();
  return <AssistantPage documentId={Number(id)} />;
}
