import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call, download, preview } from '../../services/apiClient';
import type { Document } from '../../types/domain';

export function DocumentListPage() {
  const [items, setItems] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    call<Document[]>('/api/documents/me')
      .then(setItems)
      .catch(() => setError('Unable to load medical results.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <Typography variant="h4" gutterBottom>
        My medical results
      </Typography>
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading medical results…</Typography> : null}
      {!loading && items.length === 0 ? (
        <Typography color="text.secondary">No medical results are available yet.</Typography>
      ) : null}
      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <Typography variant="h6">{item.title}</Typography>
              <Typography>
                {item.documentType.replace('_', ' ')} · {item.documentDate}
              </Typography>
              <Typography color="text.secondary">
                {item.practitioner
                  ? `Dr. ${item.practitioner.lastName} · ${item.practitioner.organization}`
                  : 'Uploaded to your record'}
              </Typography>
              <Chip size="small" sx={{ mt: 1 }} label={item.status} />
              <Button component={Link} to={`/documents/${item.id}`}>
                Open result
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </AppShell>
  );
}

export function DocumentDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Document>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    call<Document>(`/api/documents/${id}`)
      .then(setItem)
      .catch(() => setError('Unable to load this result.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppShell>
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading result…</Typography> : null}
      {item && (
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {item.title}
            </Typography>
            <Typography>
              {item.documentType.replace('_', ' ')} · {item.documentDate}
            </Typography>
            <Chip size="small" sx={{ mt: 1 }} label={item.status} />
            {item.practitioner && (
              <Typography>
                Associated practitioner: Dr. {item.practitioner.firstName}{' '}
                {item.practitioner.lastName}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                disabled={item.status !== 'AVAILABLE'}
                onClick={() =>
                  preview(`/api/documents/${id}/download`).catch((error) =>
                    setError(
                      error instanceof Error ? error.message : 'Unable to preview the document.',
                    ),
                  )
                }
              >
                View PDF
              </Button>
              <Button
                variant="outlined"
                disabled={item.status !== 'AVAILABLE'}
                onClick={() =>
                  download(`/api/documents/${id}/download`, `${item.title}.pdf`).catch(() =>
                    setError('Unable to download the document.'),
                  )
                }
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                component={Link}
                to={`/documents/${id}/ask`}
                disabled={item.status !== 'AVAILABLE'}
              >
                Ask about this result
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
