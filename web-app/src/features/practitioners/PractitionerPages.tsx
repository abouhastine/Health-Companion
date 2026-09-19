import { useEffect, useState } from 'react';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { CalendarMonthOutlined, LocationOnOutlined, TranslateOutlined } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Practitioner, Slot } from '../../types/domain';

export function PractitionerListPage() {
  const [items, setItems] = useState<Practitioner[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    call<Practitioner[]>('/api/practitioners')
      .then(setItems)
      .catch(() => setError('Unable to load practitioners.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Care team"
        title="Find a practitioner"
        description="Explore available care and reserve a time that works for you."
      />
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading practitioners…</Typography> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          title="No practitioners available"
          description="Please check again later for updated availability."
        />
      ) : null}
      <Stack spacing={2}>
        {items.map((item) => (
          <SectionCard
            key={item.id}
            sx={{
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 30px rgba(26,70,64,.10)',
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h6">
                  Dr. {item.firstName} {item.lastName}
                </Typography>
                <Chip
                  label={item.specialty}
                  color="primary"
                  sx={{ mt: 1, bgcolor: 'primary.light' }}
                />
                <Typography sx={{ mt: 1 }}>
                  {item.specialty} · {item.organization}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.address || 'Location available on request'}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.nextAvailableAt
                    ? `Next available: ${new Date(item.nextAvailableAt).toLocaleString()}`
                    : 'No available appointment currently'}
                </Typography>
              </Box>
              <Button
                component={Link}
                to={`/practitioners/${item.id}`}
                variant="contained"
                startIcon={<CalendarMonthOutlined />}
              >
                View availability
              </Button>
            </Stack>
          </SectionCard>
        ))}
      </Stack>
    </AppShell>
  );
}

export function PractitionerDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Practitioner>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const practitionerRequest = call<Practitioner>(`/api/practitioners/${id}`)
      .then(setItem)
      .catch(() => setError('Unable to load this practitioner.'));
    const slotsRequest = call<Slot[]>(`/api/practitioners/${id}/slots`)
      .then(setSlots)
      .catch(() => setError('Unable to load availability.'));
    void Promise.allSettled([practitionerRequest, slotsRequest]).then(() => setLoading(false));
  }, [id]);

  const book = async (slotId: number) => {
    try {
      await call('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({ slotId, reason }),
      });
      location.assign('/appointments');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to book this slot.');
    }
  };

  return (
    <AppShell>
      {loading ? <Typography>Loading practitioner…</Typography> : null}
      {item && (
        <>
          <PageHeader
            eyebrow="Care provider"
            title={`Dr. ${item.firstName} ${item.lastName}`}
            description={`${item.specialty} · ${item.organization}`}
          />
          <SectionCard title="Book an appointment" sx={{ bgcolor: 'rgba(255,255,255,.94)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Chip
                icon={<LocationOnOutlined />}
                label={item.address || 'Address available on request'}
                variant="outlined"
              />
              <Chip
                icon={<TranslateOutlined />}
                label={item.languages || 'Languages available on request'}
                variant="outlined"
              />
            </Stack>
            <TextField
              fullWidth
              label="Reason for visit (optional)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              sx={{ mb: 3 }}
            />
            <Typography variant="h6">Available appointments</Typography>
            <ErrorMessage message={error} />
            <Stack spacing={1} sx={{ mt: 1 }}>
              {!loading && slots.length === 0 ? (
                <Typography color="text.secondary">
                  No future appointments are available.
                </Typography>
              ) : null}
              {slots.map((slot) => (
                <SectionCard
                  key={slot.id}
                  sx={{
                    p: 2,
                    bgcolor: '#f8fcfb',
                    borderColor: 'rgba(15,118,110,.16)',
                    '&:hover': { transform: 'translateY(-1px)' },
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ sm: 'center' }}
                    spacing={1}
                  >
                    <Box>
                      <Typography fontWeight={800}>
                        {new Date(slot.startAt).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {new Date(slot.startAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                    <Button variant="contained" onClick={() => book(slot.id)}>
                      Book appointment
                    </Button>
                  </Stack>
                </SectionCard>
              ))}
            </Stack>
          </SectionCard>
        </>
      )}
    </AppShell>
  );
}
