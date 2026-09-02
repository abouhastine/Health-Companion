import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, SectionCard } from '../../components/ui';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import { clearSession } from '../../services/session';
import type { UserProfile } from '../../types/domain';

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

const emptyForm: ProfileForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    call<UserProfile>('/api/users/me')
      .then((value) => {
        setProfile(value);
        setForm({ ...value, phone: value.phone ?? '', password: '' });
      })
      .catch(() => setError('Unable to load your profile.'));
  }, []);

  const save = async () => {
    setError('');
    try {
      const updated = await call<UserProfile>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setForm({ ...updated, phone: updated.phone ?? '', password: '' });
      setEditing(false);
      setNotice('Profile updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update your profile.');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    setError('');
    try {
      await call('/api/users/me', { method: 'DELETE' });
      clearSession();
      window.location.assign('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete your account.');
    }
  };

  const setField = (field: keyof ProfileForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Manage your personal details and account access."
      />
      <ErrorMessage message={error} />
      {notice ? (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {notice}
        </Typography>
      ) : null}
      {profile ? (
        <Stack spacing={3}>
          <SectionCard>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems={{ sm: 'center' }}
            >
              <Avatar
                sx={{
                  width: 76,
                  height: 76,
                  bgcolor: 'primary.main',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                }}
              >
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {profile.firstName} {profile.lastName}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {profile.email}
                </Typography>
                <Chip
                  sx={{ mt: 2 }}
                  size="small"
                  color="primary"
                  label={profile.role.toLowerCase()}
                />
              </Box>
            </Stack>
          </SectionCard>
          <SectionCard title="Personal details">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  disabled={!editing}
                  label="First name"
                  value={form.firstName}
                  onChange={(event) => setField('firstName', event.target.value)}
                />
                <TextField
                  fullWidth
                  disabled={!editing}
                  label="Last name"
                  value={form.lastName}
                  onChange={(event) => setField('lastName', event.target.value)}
                />
              </Stack>
              <TextField
                fullWidth
                disabled={!editing}
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
              />
              <TextField
                fullWidth
                disabled={!editing}
                label="Phone"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
              />
              {editing ? (
                <TextField
                  fullWidth
                  label="New password (optional)"
                  type="password"
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  helperText="Leave blank to keep your current password."
                />
              ) : null}
              <Stack direction="row" spacing={1}>
                {editing ? (
                  <>
                    <Button variant="contained" onClick={() => void save()}>
                      Save changes
                    </Button>
                    <Button
                      onClick={() => {
                        setForm({ ...profile, phone: profile.phone ?? '', password: '' });
                        setEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={() => setEditing(true)}>
                    Edit profile
                  </Button>
                )}
              </Stack>
            </Stack>
          </SectionCard>
          {profile.role === 'PATIENT' ? (
            <SectionCard title="Delete account" sx={{ borderColor: 'error.light' }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Deletion is available only when no appointments or medical records still reference
                this account.
              </Typography>
              <Button color="error" variant="outlined" onClick={() => void deleteAccount()}>
                Delete account
              </Button>
            </SectionCard>
          ) : null}
        </Stack>
      ) : null}
    </AppShell>
  );
}
