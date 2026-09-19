import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../app/AppProviders';
import { ResponsiveRecordList } from './ui';

describe('ResponsiveRecordList', () => {
  it('exposes management records and their actions', () => {
    render(
      <AppProviders>
        <ResponsiveRecordList
          columns={['Name', 'Status']}
          rows={[{ key: 1, cells: ['Amina Benali', 'Active'], actions: <button>Edit</button> }]}
        />
      </AppProviders>,
    );

    expect(screen.getByRole('table', { name: 'Management records' })).toBeInTheDocument();
    expect(screen.getAllByText('Amina Benali').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBeGreaterThan(0);
  });
});
