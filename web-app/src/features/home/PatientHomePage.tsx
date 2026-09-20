import { useEffect, useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import {
  CalendarMonthOutlined,
  DescriptionOutlined,
  EastOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, SectionCard } from '../../components/ui';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment, Document, UserProfile } from '../../types/domain';

type HomeData = { profile: UserProfile; appointments: Appointment[]; documents: Document[] };

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
      return !next || start < new Date(next.slot.startAt).getTime() ? appointment : next;
    },
    undefined,
  );
  const latestResult = data?.documents[0];
  return (
    <AppShell>
      <PageHeader
        eyebrow="Patient space"
        title={data ? `Hello, ${data.profile.firstName}` : 'My care'}
      />
      <ErrorMessage message={error} />
      {!data && !error ? <Typography>Loading your care overview…</Typography> : null}
      {data ? (
        <Stack spacing={3}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'rgba(255,255,255,.66)', fontWeight: 800, letterSpacing: '.1em' }}
            >
              CARE PLAN
            </Typography>
            <Typography component="h2" variant="h4" sx={{ mt: 0.5 }}>
              Your care today
            </Typography>
            {nextAppointment ? (
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                alignItems={{ md: 'center' }}
                sx={{ mt: 3 }}
              >
                <Box sx={{ minWidth: 150, borderLeft: '2px solid rgba(255,255,255,.38)', pl: 2 }}>
                  <Typography fontWeight={700}>
                    {new Date(nextAppointment.slot.startAt).toLocaleDateString([], {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.72)' }}>
                    {new Date(nextAppointment.slot.startAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    Dr. {nextAppointment.practitioner.firstName}{' '}
                    {nextAppointment.practitioner.lastName}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.72)' }}>
                    {nextAppointment.practitioner.specialty}
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/appointments"
                  variant="contained"
                  color="inherit"
                  endIcon={<EastOutlined />}
                  sx={{ bgcolor: '#fff', color: 'primary.dark', '&:hover': { bgcolor: '#EEF3F7' } }}
                >
                  View appointment
                </Button>
              </Stack>
            ) : (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Typography sx={{ color: 'rgba(255,255,255,.76)' }}>
                  No appointment is scheduled. Find the right clinician when you are ready.
                </Typography>
                <Button
                  component={Link}
                  to="/practitioners"
                  variant="contained"
                  color="inherit"
                  sx={{ bgcolor: '#fff', color: 'primary.dark' }}
                >
                  Find care
                </Button>
              </Stack>
            )}
          </Box>
          <Box
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr .95fr' }, gap: 2 }}
          >
            <SectionCard
              title="Health record"
              action={<DescriptionOutlined color="primary" />}
              sx={{ height: '100%' }}
            >
              <Typography color="text.secondary">
                {latestResult
                  ? `${latestResult.title} · ${latestResult.documentDate}`
                  : 'Your medical reports will appear here when they are available.'}
              </Typography>
              <Button
                component={Link}
                to={latestResult ? `/documents/${latestResult.id}` : '/documents'}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                {latestResult ? 'Review latest result' : 'View medical results'}
              </Button>
            </SectionCard>
            <SectionCard
              title="Quick actions"
              action={<CalendarMonthOutlined color="primary" />}
              sx={{ height: '100%' }}
            >
              <Stack divider={<Divider flexItem />} spacing={1}>
                <Button
                  component={Link}
                  to="/practitioners"
                  endIcon={<EastOutlined />}
                  sx={{ justifyContent: 'space-between' }}
                >
                  Find a clinician
                </Button>
                <Button
                  component={Link}
                  to="/assistant"
                  endIcon={<EastOutlined />}
                  sx={{ justifyContent: 'space-between' }}
                >
                  Ask the health assistant
                </Button>
              </Stack>
            </SectionCard>
          </Box>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', px: 0.5 }}
          >
            <ShieldOutlined fontSize="small" color="primary" />
            <Typography variant="body2">
              Your health information stays private and under your control.
            </Typography>
          </Box>
        </Stack>
      ) : null}
    </AppShell>
  );
}
