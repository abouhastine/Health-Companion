import { Alert, Button, Container, Stack } from '@mui/material';
import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

type State = { error?: Error };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error('Uncaught application error', error, details.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Stack spacing={2}>
          <Alert severity="error">
            Health Companion could not display this page. Reload the app and try again.
          </Alert>
          <Button variant="contained" onClick={() => location.reload()}>
            Reload application
          </Button>
        </Stack>
      </Container>
    );
  }
}
