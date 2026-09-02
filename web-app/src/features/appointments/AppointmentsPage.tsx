import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState, PageHeader, SectionCard, StatusChip } from '../../components/ui';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment, Slot } from '../../types/domain';

export function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState<Appointment>();
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const refresh = useCallback(() => {
    setLoading(true);
    void call<Appointment[]>('/api/appointments/me')
      .then(setItems)
      .catch(() => setError('Unable to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!rescheduling) return;
    void call<Slot[]>(`/api/practitioners/${rescheduling.practitioner.id}/slots`)
      .then((nextSlots) =>
        setAvailableSlots(nextSlots.filter((slot) => slot.id !== rescheduling.slot.id)),
      )
      .catch(() => setError('Unable to load alternative appointment slots.'));
  }, [rescheduling]);

  const reschedule = async (slotId: number) => {
    if (!rescheduling) return;
    try {
      await call(`/api/appointments/${rescheduling.id}`, {
        method: 'PUT',
        body: JSON.stringify({ slotId, reason: rescheduling.reason || '' }),
      });
      setRescheduling(undefined);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reschedule appointment.');
    }
  };

  const now = Date.now();
  const sections = [
    {
      title: 'Upcoming',
      items: items.filter(
        (item) => item.status === 'CONFIRMED' && new Date(item.slot.endAt).getTime() > now,
      ),
    },
    {
      title: 'Past',
      items: items.filter(
        (item) =>
          item.status === 'COMPLETED' ||
          (item.status === 'CONFIRMED' && new Date(item.slot.endAt).getTime() <= now),
      ),
    },
    { title: 'Cancelled', items: items.filter((item) => item.status === 'CANCELLED') },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Care schedule"
        title="My appointments"
        description="A simple view of upcoming care and past visits."
      />
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading appointments…</Typography> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          kind="appointment"
          title="No appointments yet"
          description="Find a practitioner to book your first appointment."
        />
      ) : null}
      {!loading
        ? sections.map((section) =>
            section.items.length ? (
              <Stack key={section.title} spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mt: section.title === 'Upcoming' ? 0 : 1 }}>
                  {section.title}
                </Typography>
                {section.items.map((item) => (
                  <SectionCard key={item.id}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="h6">
                          Dr. {item.practitioner.firstName} {item.practitioner.lastName}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {new Date(item.slot.startAt).toLocaleString()}
                        </Typography>
                        {item.reason ? (
                          <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Reason: {item.reason}
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StatusChip status={item.status} />
                        {section.title === 'Upcoming' ? (
                          <>
                            <Button onClick={() => setRescheduling(item)}>Reschedule</Button>
                            <Button
                              onClick={() => {
                                void call(`/api/appointments/${item.id}`, { method: 'DELETE' })
                                  .then(() => refresh())
                                  .catch(() => setError('Unable to cancel appointment.'));
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                      </Stack>
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : null,
          )
        : null}
      <Dialog open={Boolean(rescheduling)} onClose={() => setRescheduling(undefined)} fullWidth>
        <DialogTitle>Reschedule appointment</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Choose another available time with Dr. {rescheduling?.practitioner.firstName}{' '}
            {rescheduling?.practitioner.lastName}.
          </Typography>
          <Stack spacing={1}>
            {availableSlots.length ? (
              availableSlots.map((slot) => (
                <Button key={slot.id} variant="outlined" onClick={() => void reschedule(slot.id)}>
                  {new Date(slot.startAt).toLocaleString()}
                </Button>
              ))
            ) : (
              <Typography color="text.secondary">
                No alternative slots are currently available.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduling(undefined)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
