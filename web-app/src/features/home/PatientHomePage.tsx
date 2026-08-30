import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment, Document, UserProfile } from '../../types/domain';

type HomeData = {
  profile: UserProfile;
  appointments: Appointment[];
  documents: Document[];
};

export function PatientHomePage() {
  const [data, setData] = useState<HomeData>();
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([
      call<UserProfile>('/api/users/me'),
      call<Appointment[]>('/api/appointments/me'),
      call<Document[]>('/api/documents/me'),
    ])
      .then(([profile, appointments, documents]) => setData({ profile, appointments, documents }))
      .catch(() => setError('Unable to load your health companion overview.'));
  }, []);

  const nextAppointment = data?.appointments.reduce<Appointment | undefined>(
    (next, appointment) => {
      const start = new Date(appointment.slot.startAt).getTime();
      if (appointment.status !== 'CONFIRMED' || start <= Date.now()) return next;
      if (!next || start < new Date(next.slot.startAt).getTime()) return appointment;
      return next;
    },
    undefined,
  );
  const latestResult = data?.documents[0];

  return (
    <AppShell>
      <Typography variant="h4" gutterBottom>
        {data ? `Welcome, ${data.profile.firstName}` : 'My health companion'}
      </Typography>
      <ErrorMessage message={error} />
      {!data && !error ? <Typography>Loading your overview…</Typography> : null}
      {data ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6">Next appointment</Typography>
                <Typography sx={{ my: 2 }}>
                  {nextAppointment
                    ? `Dr. ${nextAppointment.practitioner.lastName} · ${new Date(
                        nextAppointment.slot.startAt,
                      ).toLocaleString()}`
                    : 'No upcoming appointment.'}
                </Typography>
                <Button component={Link} to="/practitioners">
                  Find a practitioner
                </Button>
                <Button component={Link} to="/appointments">
                  My appointments
                </Button>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6">Latest medical result</Typography>
                <Typography sx={{ my: 2 }}>
                  {latestResult
                    ? `${latestResult.title} · ${latestResult.documentDate}`
                    : 'No medical result is available yet.'}
                </Typography>
                <Button
                  component={Link}
                  to={latestResult ? `/documents/${latestResult.id}` : '/documents'}
                >
                  {latestResult ? 'Open latest result' : 'My results'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : null}
    </AppShell>
  );
}
