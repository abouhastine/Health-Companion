import type { PropsWithChildren } from 'react';
import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { clearSession, role } from '../services/session';

export function AppShell({ children }: PropsWithChildren) {
  const currentRole = role();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Health Companion
          </Typography>
          {currentRole === 'PATIENT' ? (
            <Button color="inherit" component={Link} to="/home">
              Home
            </Button>
          ) : null}
          <Button color="inherit" component={Link} to="/practitioners">
            Practitioners
          </Button>
          {currentRole === 'PATIENT' ? (
            <>
              <Button color="inherit" component={Link} to="/appointments">
                Appointments
              </Button>
              <Button color="inherit" component={Link} to="/documents">
                Results
              </Button>
              <Button color="inherit" component={Link} to="/assistant">
                Health assistant
              </Button>
            </>
          ) : null}
          <Button color="inherit" component={Link} to="/profile">
            Profile
          </Button>
          {currentRole === 'ADMIN' ? (
            <Button color="inherit" component={Link} to="/admin">
              Back office
            </Button>
          ) : null}
          <Button
            color="inherit"
            onClick={() => {
              clearSession();
              location.assign('/login');
            }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </>
  );
}
