import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { call } from '../../services/apiClient';
import { remember } from '../../services/session';
import { AuthShell } from '../../layouts/AppShell';
import type { Auth } from '../../types/domain';
import {
  loginSchema,
  registrationFields,
  registrationSchema,
  type LoginForm,
  type RegistrationForm,
} from './schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (form) => {
    setError('');
    try {
      const auth = await call<Auth>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      remember(auth);
      navigate(auth.role === 'ADMIN' ? '/admin' : '/home');
    } catch {
      setError('Unable to sign in. Check your email and password.');
    }
  });

  return (
    <AuthShell>
      <Paper sx={{ width: 'min(440px, 100%)', p: { xs: 3, sm: 4 }, borderRadius: 4 }}>
        <Typography component="h1" color="primary.main" variant="overline" fontWeight={800}>
          Welcome back
        </Typography>
        <Typography variant="h3" fontSize="2.25rem" sx={{ mt: 0.5 }}>
          Sign in to your care
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Continue to your appointments, results and health assistant.
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <ErrorMessage message={error} />
            <Button disabled={isSubmitting} variant="contained" type="submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button component={Link} to="/register" color="inherit">
              New here? Create an account
            </Button>
          </Stack>
        </Box>
      </Paper>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationForm>({ resolver: zodResolver(registrationSchema) });
  const submit = handleSubmit(async (form) => {
    setError('');
    try {
      remember(
        await call<Auth>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(form),
        }),
      );
      navigate('/home');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to create account');
    }
  });

  return (
    <AuthShell>
      <Paper sx={{ width: 'min(500px, 100%)', p: { xs: 3, sm: 4 }, borderRadius: 4 }}>
        <Typography color="primary.main" variant="overline" fontWeight={800}>
          Your Health Companion account
        </Typography>
        <Typography variant="h3" fontSize="2.25rem" sx={{ mt: 0.5 }}>
          Create your account
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Start organizing your health information in one private place.
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            {registrationFields.map(({ name, label, type, autoComplete, required }) => (
              <TextField
                required={required}
                key={name}
                label={label}
                type={type}
                autoComplete={autoComplete}
                error={Boolean(errors[name])}
                helperText={errors[name]?.message}
                {...register(name)}
              />
            ))}
            <ErrorMessage message={error} />
            <Button disabled={isSubmitting} variant="contained" type="submit">
              {isSubmitting ? 'Creating account…' : 'Register'}
            </Button>
            <Button component={Link} to="/login" color="inherit">
              Already have an account? Sign in
            </Button>
          </Stack>
        </Box>
      </Paper>
    </AuthShell>
  );
}
