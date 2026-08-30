import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment, Practitioner, Slot, UserProfile } from '../../types/domain';

const blankPractitioner = {
  firstName: '',
  lastName: '',
  specialty: '',
  organization: '',
  address: '',
  languages: '',
};

export function AdminPage() {
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selected, setSelected] = useState<number>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [practitioner, setPractitioner] = useState(blankPractitioner);
  const [editing, setEditing] = useState<number>();
  const [slot, setSlot] = useState({ startAt: '', endAt: '' });
  const [upload, setUpload] = useState({
    patientId: '',
    practitionerId: '',
    documentType: 'LAB_RESULT',
    title: '',
    documentDate: '',
    file: undefined as File | undefined,
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [nextPatients, nextAppointments, nextPractitioners] = await Promise.all([
        call<UserProfile[]>('/api/admin/patients'),
        call<Appointment[]>('/api/admin/appointments'),
        call<Practitioner[]>('/api/admin/practitioners'),
      ]);
      setPatients(nextPatients);
      setAppointments(nextAppointments);
      setPractitioners(nextPractitioners);
      setSelected((current) => current ?? nextPractitioners[0]?.id);
    } catch {
      setError('Unable to load back-office data.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (selected)
      call<Slot[]>(`/api/admin/practitioners/${selected}/slots`)
        .then(setSlots)
        .catch(() => setError('Unable to load slots.'));
  }, [selected]);

  const savePractitioner = async () => {
    try {
      if (editing)
        await call(`/api/admin/practitioners/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(practitioner),
        });
      else
        await call('/api/admin/practitioners', {
          method: 'POST',
          body: JSON.stringify(practitioner),
        });
      setPractitioner(blankPractitioner);
      setEditing(undefined);
      setNotice('Practitioner saved.');
      refresh();
    } catch {
      setError('Unable to save practitioner.');
    }
  };

  const saveSlot = async () => {
    if (!selected) return;
    try {
      await call(`/api/admin/practitioners/${selected}/slots`, {
        method: 'POST',
        body: JSON.stringify({ ...slot, available: true }),
      });
      setSlot({ startAt: '', endAt: '' });
      setSlots(await call<Slot[]>(`/api/admin/practitioners/${selected}/slots`));
      setNotice('Appointment slot created.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to create slot.');
    }
  };

  const saveUpload = async () => {
    if (!upload.file) {
      setError('Select a PDF document first.');
      return;
    }
    try {
      const form = new FormData();
      Object.entries(upload).forEach(([key, value]) => {
        if (value && key !== 'file') form.append(key, value as string);
      });
      form.append('file', upload.file);
      await call('/api/admin/documents', { method: 'POST', body: form });
      setNotice('Medical document uploaded and queued for retrieval.');
      setUpload({
        patientId: '',
        practitionerId: '',
        documentType: 'LAB_RESULT',
        title: '',
        documentDate: '',
        file: undefined,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to upload document.');
    }
  };

  const updatePractitioner = (key: keyof typeof practitioner, value: string) =>
    setPractitioner({ ...practitioner, [key]: value });

  return (
    <AppShell>
      <Typography variant="h4" gutterBottom>
        Back office
      </Typography>
      <Typography color="text.secondary">
        Manage practitioners, availability, patients, appointments, and patient documents.
      </Typography>
      <ErrorMessage message={error} />
      {notice && (
        <Alert severity="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      <Stack spacing={4} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Practitioners</Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {Object.entries(practitioner).map(([key, value]) => (
                <TextField
                  key={key}
                  required={['firstName', 'lastName', 'specialty', 'organization'].includes(key)}
                  label={key.replace(/([A-Z])/g, ' $1')}
                  value={value}
                  onChange={(event) =>
                    updatePractitioner(key as keyof typeof practitioner, event.target.value)
                  }
                />
              ))}
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={savePractitioner}>
                  {editing ? 'Update practitioner' : 'Add practitioner'}
                </Button>
                {editing && (
                  <Button
                    onClick={() => {
                      setEditing(undefined);
                      setPractitioner(blankPractitioner);
                    }}
                  >
                    Cancel edit
                  </Button>
                )}
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            {practitioners.map((item) => (
              <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                <Typography sx={{ flexGrow: 1 }}>
                  Dr. {item.firstName} {item.lastName} · {item.specialty}
                </Typography>
                <Button
                  onClick={() => {
                    setEditing(item.id);
                    setPractitioner({
                      firstName: item.firstName,
                      lastName: item.lastName,
                      specialty: item.specialty,
                      organization: item.organization,
                      address: item.address || '',
                      languages: item.languages || '',
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  onClick={() =>
                    call(`/api/admin/practitioners/${item.id}`, { method: 'DELETE' })
                      .then(refresh)
                      .catch(() => setError('Unable to delete practitioner.'))
                  }
                >
                  Delete
                </Button>
              </Stack>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Appointment slots</Typography>
            <TextField
              select
              fullWidth
              label="Practitioner"
              value={selected || ''}
              onChange={(event) => setSelected(Number(event.target.value))}
              sx={{ mt: 2 }}
            >
              {practitioners.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  Dr. {item.firstName} {item.lastName}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Start"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={slot.startAt}
                onChange={(event) => setSlot({ ...slot, startAt: event.target.value })}
              />
              <TextField
                fullWidth
                label="End"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={slot.endAt}
                onChange={(event) => setSlot({ ...slot, endAt: event.target.value })}
              />
              <Button variant="contained" onClick={saveSlot}>
                Add slot
              </Button>
            </Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {slots.map((item) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ flexGrow: 1 }}>
                    {new Date(item.startAt).toLocaleString()} ·{' '}
                    {item.available ? 'Available' : 'Unavailable'}
                  </Typography>
                  <Button
                    onClick={() => {
                      void call(`/api/admin/slots/${item.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          startAt: item.startAt,
                          endAt: item.endAt,
                          available: !item.available,
                        }),
                      }).then(() => {
                        if (selected)
                          return call<Slot[]>(`/api/admin/practitioners/${selected}/slots`).then(
                            setSlots,
                          );
                      });
                    }}
                  >
                    {item.available ? 'Mark unavailable' : 'Mark available'}
                  </Button>
                  <Button
                    color="error"
                    onClick={() =>
                      call(`/api/admin/slots/${item.id}`, { method: 'DELETE' })
                        .then(() =>
                          setSlots((currentSlots) =>
                            currentSlots.filter((current) => current.id !== item.id),
                          ),
                        )
                        .catch(() => setError('Unable to delete slot.'))
                    }
                  >
                    Delete
                  </Button>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Upload medical document</Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <TextField
                select
                required
                label="Patient"
                value={upload.patientId}
                onChange={(event) => setUpload({ ...upload, patientId: event.target.value })}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} · {patient.email}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Associated practitioner (optional)"
                value={upload.practitionerId}
                onChange={(event) => setUpload({ ...upload, practitionerId: event.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {practitioners.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    Dr. {item.firstName} {item.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Document type"
                value={upload.documentType}
                onChange={(event) => setUpload({ ...upload, documentType: event.target.value })}
              >
                {['LAB_RESULT', 'IMAGING_RESULT', 'MEDICAL_REPORT', 'PRESCRIPTION', 'OTHER'].map(
                  (type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <TextField
                required
                label="Title"
                value={upload.title}
                onChange={(event) => setUpload({ ...upload, title: event.target.value })}
              />
              <TextField
                required
                label="Document date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={upload.documentDate}
                onChange={(event) => setUpload({ ...upload, documentDate: event.target.value })}
              />
              <Button component="label" variant="outlined">
                {upload.file?.name || 'Choose PDF'}
                <input
                  hidden
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setUpload({ ...upload, file: event.target.files?.[0] })}
                />
              </Button>
              <Button variant="contained" onClick={saveUpload}>
                Upload document
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Patients</Typography>
            {patients.map((patient) => (
              <Typography key={patient.id}>
                {patient.firstName} {patient.lastName} — {patient.email}
              </Typography>
            ))}
            <Typography variant="h6" sx={{ mt: 3 }}>
              Appointments
            </Typography>
            {appointments.map((item) => (
              <Typography key={item.id}>
                #{item.id} · {item.patient?.firstName} {item.patient?.lastName} · Dr.{' '}
                {item.practitioner?.lastName} · {item.status}
              </Typography>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </AppShell>
  );
}
