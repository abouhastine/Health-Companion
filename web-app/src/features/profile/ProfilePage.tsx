import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormSection, PageHeader, SectionCard } from '../../components/ui';
import { PersonOutline, PhoneOutlined, LockOutlined } from '@mui/icons-material';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          password: form.password,
        }),
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
    setError('');
    setDeletingAccount(true);
    try {
      await call('/api/users/me', { method: 'DELETE' });
      clearSession();
      window.location.assign('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete your account.');
      setDeletingAccount(false);
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
      {error ? (
        <Box sx={{ mb: 2 }}>
          <ErrorMessage message={error} />
        </Box>
      ) : null}
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
          <SectionCard title="Personal details" sx={{ overflow: 'hidden' }}>
            <Stack spacing={2}>
              <FormSection
                icon={<PersonOutline />}
                title="About you"
                description="Keep the details your care team uses up to date."
              >
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
              </FormSection>
              <FormSection
                icon={<PhoneOutlined />}
                title="Contact"
                description="Your email identifies this account and cannot be changed."
              >
                <TextField
                  fullWidth
                  disabled
                  label="Email"
                  type="email"
                  value={form.email}
                  helperText="Email is your account identifier and cannot be changed."
                />
                <TextField
                  fullWidth
                  disabled={!editing}
                  label="Phone"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                />
              </FormSection>
              {editing ? (
                <FormSection
                  icon={<LockOutlined />}
                  title="Password"
                  description="Optional — leave this blank to keep your current password."
                >
                  <TextField
                    fullWidth
                    label="New password (optional)"
                    type="password"
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                  />
                </FormSection>
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
                Deletion is available only when no appointments, medical records, or chat history
                still reference this account.
              </Typography>
              <Button color="error" variant="outlined" onClick={() => setDeleteDialogOpen(true)}>
                Delete account
              </Button>
            </SectionCard>
          ) : null}
        </Stack>
      ) : null}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingAccount && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Your account can only be deleted when no appointments,
            medical records, or chat history still reference it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingAccount}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void deleteAccount()}
            disabled={deletingAccount}
          >
            {deletingAccount ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
