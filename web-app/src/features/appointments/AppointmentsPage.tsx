import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment } from '../../types/domain';

export function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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
      <Typography variant="h4" gutterBottom>
        My appointments
      </Typography>
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading appointments…</Typography> : null}
      {!loading && items.length === 0 ? (
        <Typography color="text.secondary">You have no appointments yet.</Typography>
      ) : null}
      {!loading
        ? sections.map((section) =>
            section.items.length ? (
              <Stack key={section.title} spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h6">{section.title}</Typography>
                {section.items.map((item) => (
                  <Card key={item.id}>
                    <CardContent>
                      <Typography>
                        Dr. {item.practitioner.firstName} {item.practitioner.lastName}
                      </Typography>
                      <Typography>
                        {new Date(item.slot.startAt).toLocaleString()} ·{' '}
                        <Chip size="small" label={item.status} />
                      </Typography>
                      {item.reason ? (
                        <Typography color="text.secondary">Reason: {item.reason}</Typography>
                      ) : null}
                      {section.title === 'Upcoming' ? (
                        <Button
                          onClick={() => {
                            void call(`/api/appointments/${item.id}`, { method: 'DELETE' })
                              .then(() => refresh())
                              .catch(() => setError('Unable to cancel appointment.'));
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : null,
          )
        : null}
    </AppShell>
  );
}
