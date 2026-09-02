import { useEffect, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
  CalendarMonthOutlined,
  DescriptionOutlined,
  PsychologyOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, SectionCard } from '../../components/ui';
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
      <PageHeader
        eyebrow="Personal care space"
        title={data ? `Welcome back, ${data.profile.firstName}` : 'My health companion'}
        description="Keep track of the care that matters today."
      />
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
          <SectionCard
            title="Next appointment"
            sx={{ height: '100%', bgcolor: 'rgba(255,255,255,.82)' }}
            action={<CalendarMonthOutlined color="primary" />}
          >
            <Typography color="text.secondary" sx={{ minHeight: 50 }}>
              {nextAppointment
                ? `Dr. ${nextAppointment.practitioner.lastName} · ${new Date(
                    nextAppointment.slot.startAt,
                  ).toLocaleString()}`
                : 'No upcoming appointment.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button component={Link} to="/practitioners" variant="contained">
                Find care
              </Button>
              <Button component={Link} to="/appointments">
                All appointments
              </Button>
            </Stack>
          </SectionCard>
          <SectionCard
            title="Latest medical result"
            sx={{ height: '100%', bgcolor: 'rgba(255,255,255,.82)' }}
            action={<DescriptionOutlined color="primary" />}
          >
            <Typography color="text.secondary" sx={{ minHeight: 50 }}>
              {latestResult
                ? `${latestResult.title} · ${latestResult.documentDate}`
                : 'No medical result is available yet.'}
            </Typography>
            <Button
              component={Link}
              to={latestResult ? `/documents/${latestResult.id}` : '/documents'}
              variant="outlined"
            >
              {latestResult ? 'Open latest result' : 'View my results'}
            </Button>
          </SectionCard>
          <SectionCard sx={{ gridColumn: { md: '1 / -1' }, bgcolor: 'secondary.light', border: 0 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Chip
                  icon={<PsychologyOutlined />}
                  label="Health assistant"
                  color="primary"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6">Need help understanding health information?</Typography>
                <Typography color="text.secondary">
                  Ask for a clear, source-grounded explanation of your available results.
                </Typography>
              </Box>
              <Button component={Link} to="/assistant" variant="contained">
                Open assistant
              </Button>
            </Stack>
          </SectionCard>
        </Box>
      ) : null}
    </AppShell>
  );
}
