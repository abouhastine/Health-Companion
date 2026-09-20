import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { AdminPage } from './AdminPage';

vi.mock('../../services/apiClient', () => ({
  call: vi.fn((path: string) => {
    if (path === '/api/admin/patients') {
      return Promise.resolve([
        {
          id: 1,
          firstName: 'Amina',
          lastName: 'Ben Ali',
          email: 'amina@example.test',
          role: 'PATIENT',
        },
      ]);
    }
    return Promise.resolve([]);
  }),
}));

describe('AdminPage', () => {
  it('presents patients in the same responsive record-list pattern as user accounts', async () => {
    render(
      <AppProviders>
        <AdminPage section="users" />
      </AppProviders>,
    );

    expect((await screen.findAllByRole('table', { name: 'Management records' })).length).toBe(2);
    expect(screen.getAllByText('Amina Ben Ali').length).toBeGreaterThan(0);
  });
});
