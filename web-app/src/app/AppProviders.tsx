import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './theme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  );
}
