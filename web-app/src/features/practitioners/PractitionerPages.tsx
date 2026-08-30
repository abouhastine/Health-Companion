import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
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
      <Typography variant="h4" gutterBottom>
        Find a practitioner
      </Typography>
      <ErrorMessage message={error} />
      {loading ? <Typography>Loading practitioners…</Typography> : null}
      {!loading && items.length === 0 ? (
        <Typography color="text.secondary">No practitioners are available.</Typography>
      ) : null}
      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <Typography variant="h6">
                Dr. {item.firstName} {item.lastName}
              </Typography>
              <Typography>
                {item.specialty} · {item.organization}
              </Typography>
              <Typography color="text.secondary">
                {item.address || 'Location available on request'}
              </Typography>
              <Typography color="text.secondary">
                {item.nextAvailableAt
                  ? `Next available: ${new Date(item.nextAvailableAt).toLocaleString()}`
                  : 'No available appointment currently'}
              </Typography>
              <Button component={Link} to={`/practitioners/${item.id}`}>
                View availability
              </Button>
            </CardContent>
          </Card>
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
          <Typography variant="h4">
            Dr. {item.firstName} {item.lastName}
          </Typography>
          <Typography sx={{ mb: 1 }}>
            {item.specialty} · {item.organization}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {item.address || 'Address available on request'} ·{' '}
            {item.languages || 'Languages available on request'}
          </Typography>
          <TextField
            fullWidth
            label="Reason for visit (optional)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6">Available appointments</Typography>
          <ErrorMessage message={error} />
          <Stack spacing={1} sx={{ mt: 1 }}>
            {!loading && slots.length === 0 ? (
              <Typography color="text.secondary">No future appointments are available.</Typography>
            ) : null}
            {slots.map((slot) => (
              <Card key={slot.id}>
                <CardContent>
                  <Typography>{new Date(slot.startAt).toLocaleString()}</Typography>
                  <Button variant="contained" onClick={() => book(slot.id)}>
                    Book appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}
    </AppShell>
  );
}
