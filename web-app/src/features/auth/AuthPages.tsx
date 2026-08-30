import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage';
import { call } from '../../services/apiClient';
import { remember } from '../../services/session';
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
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Typography variant="h3" gutterBottom>
        Welcome back
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
          <Button component={Link} to="/register">
            Create an account
          </Button>
        </Stack>
      </Box>
    </Container>
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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom>
        Create your account
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
        </Stack>
      </Box>
    </Container>
  );
}
