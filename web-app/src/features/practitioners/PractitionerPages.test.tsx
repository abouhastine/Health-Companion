import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { PractitionerListPage } from './PractitionerPages';

vi.mock('../../services/apiClient', () => ({
  call: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        firstName: 'Sami',
        lastName: 'Mansour',
        specialty: 'Cardiology',
        organization: 'Central Clinic',
        address: '1 Care Street',
      },
    ]),
  ),
}));

describe('PractitionerListPage', () => {
  it('exposes each practitioner specialty as a dedicated, readable badge', async () => {
    render(
      <AppProviders>
        <PractitionerListPage />
      </AppProviders>,
    );

    expect(await screen.findByTestId('specialty-badge')).toHaveTextContent('Cardiology');
  });
});
