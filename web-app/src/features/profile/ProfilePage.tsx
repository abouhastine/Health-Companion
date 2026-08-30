import { useEffect, useState } from 'react';
import { Card, CardContent, Chip, Typography } from '@mui/material';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AppShell } from '../../layouts/AppShell';
import { call } from '../../services/apiClient';
import type { UserProfile } from '../../types/domain';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>();
  const [error, setError] = useState('');

  useEffect(() => {
    call<UserProfile>('/api/users/me')
      .then(setProfile)
      .catch(() => setError('Unable to load your profile.'));
  }, []);

  return (
    <AppShell>
      <Typography variant="h4" gutterBottom>
        My profile
      </Typography>
      <ErrorMessage message={error} />
      {profile && (
        <Card>
          <CardContent>
            <Typography variant="h6">
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography>{profile.email}</Typography>
            <Typography>{profile.phone || 'No phone number on file'}</Typography>
            <Chip sx={{ mt: 2 }} size="small" label={profile.role} />
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
