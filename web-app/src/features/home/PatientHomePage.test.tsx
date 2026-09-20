import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { PatientHomePage } from './PatientHomePage';

vi.mock('../../services/apiClient', () => ({
  call: vi.fn((path: string) => {
    if (path === '/api/users/me') {
      return Promise.resolve({ firstName: 'Amina', lastName: 'Ben Ali' });
    }
    if (path === '/api/appointments/me') {
      return Promise.resolve([
        {
          id: 1,
          status: 'CONFIRMED',
          practitioner: { firstName: 'Sami', lastName: 'Mansour', specialty: 'Cardiology' },
          slot: { startAt: '2099-06-15T09:30:00Z', endAt: '2099-06-15T10:00:00Z' },
        },
      ]);
    }
    return Promise.resolve([]);
  }),
}));

describe('PatientHomePage', () => {
  it('puts today’s next care action ahead of the health-record summary', async () => {
    render(
      <AppProviders>
        <PatientHomePage />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Your care today' })).toBeInTheDocument();
    expect(screen.getByText('Dr. Sami Mansour')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View appointment' })).toHaveAttribute(
      'href',
      '/appointments',
    );
  });
});
