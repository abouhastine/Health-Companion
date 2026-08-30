import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('application routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/profile');
  });

  it('redirects an unauthenticated protected route to sign in', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });
});
