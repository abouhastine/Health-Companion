import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { LoginPage } from './AuthPages';

describe('LoginPage', () => {
  it('offers an accessible password visibility control', () => {
    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
