import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DownloadOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState, PageHeader, SectionCard } from '../../components/ui';
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
      <PageHeader
        eyebrow="Health record"
        title="Medical results"
        description="Your reports are private, organized and ready when you need them."
      />
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading medical results…</Typography> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          kind="document"
          title="No medical results yet"
          description="New reports shared by your care team will appear here."
        />
      ) : null}
      <Stack spacing={2}>
        {items.map((item) => (
          <SectionCard
            key={item.id}
            sx={{
              transition: 'transform .18s ease, box-shadow .18s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 30px rgba(21, 75, 70, .09)',
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h6">{item.title}</Typography>
                <Typography sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                  {item.documentType.replace(/_/g, ' ').toLowerCase()} · {item.documentDate}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.practitioner
                    ? `Dr. ${item.practitioner.lastName} · ${item.practitioner.organization}`
                    : 'Uploaded to your record'}
                </Typography>
              </Box>
              <Button
                component={Link}
                to={`/documents/${item.id}`}
                variant="outlined"
                startIcon={<VisibilityOutlined />}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}
              >
                Open result
              </Button>
            </Stack>
          </SectionCard>
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
        <>
          <PageHeader
            eyebrow="Medical result"
            title={item.title}
            description={`${item.documentType.replace(/_/g, ' ').toLowerCase()} · ${item.documentDate}`}
          />
          <SectionCard>
            {item.practitioner && (
              <Typography color="text.secondary">
                Associated practitioner: Dr. {item.practitioner.firstName}{' '}
                {item.practitioner.lastName}
              </Typography>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<VisibilityOutlined />}
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
                startIcon={<DownloadOutlined />}
                onClick={() =>
                  download(`/api/documents/${id}/download`, `${item.title}.pdf`).catch(() =>
                    setError('Unable to download the document.'),
                  )
                }
              >
                Download PDF
              </Button>
            </Stack>
          </SectionCard>
        </>
      )}
    </AppShell>
  );
}
