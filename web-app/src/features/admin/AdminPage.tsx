import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarMonthOutlined,
  DescriptionOutlined,
  GroupOutlined,
  MedicalServicesOutlined,
  ScheduleOutlined,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, ResponsiveRecordList } from '../../components/ui';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { Appointment, Document, Practitioner, Slot, UserProfile } from '../../types/domain';

const blankPractitioner = {
  firstName: '',
  lastName: '',
  specialty: '',
  organization: '',
  address: '',
  languages: '',
};

const blankUser = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'PATIENT',
};

export type AdminSection =
  'users' | 'documents' | 'practitioners' | 'availability' | 'appointments';

type DeleteTarget = {
  kind: 'user' | 'document' | 'practitioner' | 'slot' | 'appointment';
  id: number;
  label: string;
};

const adminPageCopy: Record<AdminSection, { title: string; description: string }> = {
  users: {
    title: 'User management',
    description: 'Create and manage patient and administrator accounts.',
  },
  documents: {
    title: 'Document management',
    description: 'Upload, update, re-index, and manage patient medical documents.',
  },
  practitioners: {
    title: 'Practitioner management',
    description: 'Maintain the practitioner directory available to patients.',
  },
  availability: {
    title: 'Availability management',
    description: 'Create and maintain appointment slots for practitioners.',
  },
  appointments: {
    title: 'Appointment management',
    description: 'Review appointment activity and update appointment status.',
  },
};

export function AdminPage({ section }: { section: AdminSection }) {
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [accounts, setAccounts] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selected, setSelected] = useState<number>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [practitioner, setPractitioner] = useState(blankPractitioner);
  const [editing, setEditing] = useState<number>();
  const [editingUser, setEditingUser] = useState<number>();
  const [user, setUser] = useState(blankUser);
  const [slot, setSlot] = useState({ startAt: '', endAt: '' });
  const [upload, setUpload] = useState({
    patientId: '',
    practitionerId: '',
    documentType: 'LAB_RESULT',
    title: '',
    documentDate: '',
    file: undefined as File | undefined,
  });
  const [editingDocument, setEditingDocument] = useState<number>();
  const [document, setDocument] = useState({
    title: '',
    documentType: 'LAB_RESULT',
    documentDate: '',
    practitionerId: '',
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>();
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nextPatients, nextAccounts, nextAppointments, nextPractitioners, nextDocuments] =
        await Promise.all([
          call<UserProfile[]>('/api/admin/patients'),
          call<UserProfile[]>('/api/admin/users'),
          call<Appointment[]>('/api/admin/appointments'),
          call<Practitioner[]>('/api/admin/practitioners'),
          call<Document[]>('/api/admin/documents'),
        ]);
      setPatients(nextPatients);
      setAccounts(nextAccounts);
      setAppointments(nextAppointments);
      setPractitioners(nextPractitioners);
      setDocuments(nextDocuments);
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

  const saveUser = async () => {
    try {
      if (editingUser) {
        const payload = {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          password: user.password || undefined,
          role: user.role,
        };
        await call(`/api/admin/users/${editingUser}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await call('/api/admin/users', { method: 'POST', body: JSON.stringify(user) });
      }
      setUser(blankUser);
      setEditingUser(undefined);
      setNotice('User saved.');
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save user.');
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
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to upload document.');
    }
  };

  const saveDocument = async () => {
    if (!editingDocument) return;
    try {
      await call(`/api/admin/documents/${editingDocument}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...document,
          practitionerId: document.practitionerId ? Number(document.practitionerId) : null,
        }),
      });
      setEditingDocument(undefined);
      setDocument({ title: '', documentType: 'LAB_RESULT', documentDate: '', practitionerId: '' });
      setNotice('Document details saved.');
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update document.');
    }
  };

  const changeAppointmentStatus = async (id: number, status: Appointment['status']) => {
    try {
      await call(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setNotice('Appointment updated.');
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update appointment.');
    }
  };

  const updatePractitioner = (key: keyof typeof practitioner, value: string) =>
    setPractitioner({ ...practitioner, [key]: value });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    const paths = {
      user: `/api/admin/users/${id}`,
      document: `/api/admin/documents/${id}`,
      practitioner: `/api/admin/practitioners/${id}`,
      slot: `/api/admin/slots/${id}`,
      appointment: `/api/admin/appointments/${id}`,
    };
    setDeleting(true);
    setError('');
    try {
      await call(paths[kind], { method: 'DELETE' });
      setDeleteTarget(undefined);
      setNotice(`${deleteTarget.label} deleted.`);
      if (kind === 'slot') setSlots((current) => current.filter((item) => item.id !== id));
      else await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to delete ${deleteTarget.label}.`);
    } finally {
      setDeleting(false);
    }
  };

  const page = adminPageCopy[section];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title={page.title} description={page.description} />
      <ErrorMessage message={error} onClose={() => setError('')} />
      {notice && (
        <Alert severity="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      <Stack spacing={4} sx={{ mt: 3 }}>
        {section === 'users' ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">User accounts</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                Create and manage patient and administrator accounts. Password is optional when
                editing.
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    required
                    label="First name"
                    value={user.firstName}
                    onChange={(event) => setUser({ ...user, firstName: event.target.value })}
                  />
                  <TextField
                    fullWidth
                    required
                    label="Last name"
                    value={user.lastName}
                    onChange={(event) => setUser({ ...user, lastName: event.target.value })}
                  />
                </Stack>
                <TextField
                  required
                  label="Email"
                  type="email"
                  value={user.email}
                  disabled={Boolean(editingUser)}
                  onChange={(event) => setUser({ ...user, email: event.target.value })}
                  helperText={
                    editingUser
                      ? 'Email is the account identifier and cannot be changed.'
                      : undefined
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={user.phone}
                    onChange={(event) => setUser({ ...user, phone: event.target.value })}
                  />
                  <TextField
                    fullWidth
                    required={!editingUser}
                    label={editingUser ? 'New password (optional)' : 'Password'}
                    type="password"
                    value={user.password}
                    onChange={(event) => setUser({ ...user, password: event.target.value })}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Role"
                    value={user.role}
                    onChange={(event) => setUser({ ...user, role: event.target.value })}
                  >
                    <MenuItem value="PATIENT">Patient</MenuItem>
                    <MenuItem value="ADMIN">Administrator</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={saveUser}>
                    {editingUser ? 'Update user' : 'Create user'}
                  </Button>
                  {editingUser ? (
                    <Button
                      onClick={() => {
                        setEditingUser(undefined);
                        setUser(blankUser);
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <ResponsiveRecordList
                columns={['Name', 'Email', 'Role']}
                rows={accounts.map((account) => ({
                  key: account.id,
                  cells: [
                    <Typography fontWeight={700}>
                      {account.firstName} {account.lastName}
                    </Typography>,
                    account.email,
                    account.role,
                  ],
                  actions: (
                    <>
                      <Button
                        onClick={() => {
                          setEditingUser(account.id);
                          setUser({
                            firstName: account.firstName,
                            lastName: account.lastName,
                            email: account.email,
                            phone: account.phone || '',
                            password: '',
                            role: account.role,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        color="error"
                        onClick={() =>
                          setDeleteTarget({ kind: 'user', id: account.id, label: account.email })
                        }
                      >
                        Delete
                      </Button>
                    </>
                  ),
                }))}
              />
            </CardContent>
          </Card>
        ) : null}
        {section === 'documents' ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Document library</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                Edit metadata, re-index a result after a provider change, or remove an unreferenced
                document.
              </Typography>
              {editingDocument ? (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <TextField
                    required
                    label="Title"
                    value={document.title}
                    onChange={(event) => setDocument({ ...document, title: event.target.value })}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      select
                      fullWidth
                      label="Document type"
                      value={document.documentType}
                      onChange={(event) =>
                        setDocument({ ...document, documentType: event.target.value })
                      }
                    >
                      {[
                        'LAB_RESULT',
                        'IMAGING_RESULT',
                        'MEDICAL_REPORT',
                        'PRESCRIPTION',
                        'OTHER',
                      ].map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      required
                      fullWidth
                      label="Document date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={document.documentDate}
                      onChange={(event) =>
                        setDocument({ ...document, documentDate: event.target.value })
                      }
                    />
                    <TextField
                      select
                      fullWidth
                      label="Practitioner"
                      value={document.practitionerId}
                      onChange={(event) =>
                        setDocument({ ...document, practitionerId: event.target.value })
                      }
                    >
                      <MenuItem value="">None</MenuItem>
                      {practitioners.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          Dr. {item.firstName} {item.lastName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={saveDocument}>
                      Save details
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingDocument(undefined);
                        setDocument({
                          title: '',
                          documentType: 'LAB_RESULT',
                          documentDate: '',
                          practitionerId: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : null}
              <Box sx={{ mt: 2 }}>
                <ResponsiveRecordList
                  columns={['Title', 'Type', 'Status']}
                  rows={documents.map((item) => ({
                    key: item.id,
                    cells: [
                      <Typography fontWeight={700}>{item.title}</Typography>,
                      item.documentType.replaceAll('_', ' '),
                      item.status,
                    ],
                    actions: (
                      <>
                        <Button
                          onClick={() => {
                            setEditingDocument(item.id);
                            setDocument({
                              title: item.title,
                              documentType: item.documentType,
                              documentDate: item.documentDate,
                              practitionerId: item.practitioner?.id?.toString() || '',
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            void call(`/api/admin/documents/${item.id}/reindex`, { method: 'POST' })
                              .then(() => {
                                setNotice('Document re-indexed.');
                                return refresh();
                              })
                              .catch((cause) =>
                                setError(
                                  cause instanceof Error
                                    ? cause.message
                                    : 'Unable to re-index document.',
                                ),
                              )
                          }
                        >
                          Re-index
                        </Button>
                        <Button
                          color="error"
                          onClick={() =>
                            setDeleteTarget({ kind: 'document', id: item.id, label: item.title })
                          }
                        >
                          Delete
                        </Button>
                      </>
                    ),
                  }))}
                />
              </Box>
            </CardContent>
          </Card>
        ) : null}
        {section === 'practitioners' ? (
          <Card sx={{ borderRadius: 3 }}>
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
              <ResponsiveRecordList
                columns={['Practitioner', 'Specialty']}
                rows={practitioners.map((item) => ({
                  key: item.id,
                  cells: [
                    <Typography fontWeight={700}>
                      Dr. {item.firstName} {item.lastName}
                    </Typography>,
                    item.specialty,
                  ],
                  actions: (
                    <>
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
                          setDeleteTarget({
                            kind: 'practitioner',
                            id: item.id,
                            label: `Dr. ${item.firstName} ${item.lastName}`,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </>
                  ),
                }))}
              />
            </CardContent>
          </Card>
        ) : null}
        {section === 'availability' ? (
          <Card sx={{ borderRadius: 3 }}>
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
              <Box sx={{ mt: 2 }}>
                <ResponsiveRecordList
                  columns={['Start', 'Status']}
                  rows={slots.map((item) => ({
                    key: item.id,
                    cells: [
                      new Date(item.startAt).toLocaleString(),
                      item.available ? 'Available' : 'Unavailable',
                    ],
                    actions: (
                      <>
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
                                return call<Slot[]>(
                                  `/api/admin/practitioners/${selected}/slots`,
                                ).then(setSlots);
                            });
                          }}
                        >
                          {item.available ? 'Mark unavailable' : 'Mark available'}
                        </Button>
                        <Button
                          color="error"
                          onClick={() =>
                            setDeleteTarget({
                              kind: 'slot',
                              id: item.id,
                              label: `slot on ${new Date(item.startAt).toLocaleString()}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </>
                    ),
                  }))}
                />
              </Box>
            </CardContent>
          </Card>
        ) : null}
        {section === 'documents' ? (
          <Card sx={{ borderRadius: 3 }}>
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
        ) : null}
        {section === 'users' ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Patients</Typography>
              {patients.map((patient) => (
                <Typography key={patient.id}>
                  {patient.firstName} {patient.lastName} — {patient.email}
                </Typography>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {section === 'appointments' ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Appointments</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                Update appointment status or delete an appointment when appropriate.
              </Typography>
              <ResponsiveRecordList
                columns={['Patient', 'Practitioner', 'Status']}
                rows={appointments.map((item) => ({
                  key: item.id,
                  cells: [
                    <Typography fontWeight={700}>
                      {item.patient?.firstName} {item.patient?.lastName}
                    </Typography>,
                    `Dr. ${item.practitioner?.lastName}`,
                    item.status,
                  ],
                  actions: (
                    <>
                      {item.status === 'CONFIRMED' ? (
                        <Button onClick={() => void changeAppointmentStatus(item.id, 'CANCELLED')}>
                          Cancel
                        </Button>
                      ) : null}
                      {item.status === 'CONFIRMED' ? (
                        <Button onClick={() => void changeAppointmentStatus(item.id, 'COMPLETED')}>
                          Complete
                        </Button>
                      ) : null}
                      <Button
                        color="error"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'appointment',
                            id: item.id,
                            label: `appointment #${item.id}`,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </>
                  ),
                }))}
              />
            </CardContent>
          </Card>
        ) : null}
      </Stack>
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(undefined)}>
        <DialogTitle>Delete {deleteTarget?.label}?</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(undefined)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}

export function AdminOverviewPage() {
  const [summary, setSummary] = useState({
    users: 0,
    documents: 0,
    practitioners: 0,
    appointments: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      call<UserProfile[]>('/api/admin/users'),
      call<Document[]>('/api/admin/documents'),
      call<Practitioner[]>('/api/admin/practitioners'),
      call<Appointment[]>('/api/admin/appointments'),
    ])
      .then(([users, documents, practitioners, appointments]) =>
        setSummary({
          users: users.length,
          documents: documents.length,
          practitioners: practitioners.length,
          appointments: appointments.length,
        }),
      )
      .catch(() => setError('Unable to load back-office overview.'));
  }, []);

  const cards = [
    { label: 'User accounts', value: summary.users, to: '/admin/users', icon: <GroupOutlined /> },
    {
      label: 'Medical documents',
      value: summary.documents,
      to: '/admin/documents',
      icon: <DescriptionOutlined />,
    },
    {
      label: 'Practitioners',
      value: summary.practitioners,
      to: '/admin/practitioners',
      icon: <MedicalServicesOutlined />,
    },
    {
      label: 'Appointments',
      value: summary.appointments,
      to: '/admin/appointments',
      icon: <CalendarMonthOutlined />,
    },
    {
      label: 'Availability',
      value: 'Manage',
      to: '/admin/availability',
      icon: <ScheduleOutlined />,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Back office overview"
        description="Monitor the essentials and open a focused workspace for each administration task."
      />
      <ErrorMessage message={error} onClose={() => setError('')} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mt: 3,
        }}
      >
        {cards.map((card) => (
          <Card key={card.to} sx={{ borderRadius: 3 }}>
            <CardActionArea component={RouterLink} to={card.to} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {card.label}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box color="primary.main">{card.icon}</Box>
                </Stack>
                <Typography color="primary.main" fontWeight={700} sx={{ mt: 3 }}>
                  Open workspace
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </AppShell>
  );
}
