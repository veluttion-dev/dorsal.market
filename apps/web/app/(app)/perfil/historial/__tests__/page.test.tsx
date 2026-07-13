import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from '../page';

const mocks = vi.hoisted(() => ({
  purchases: {} as unknown,
  sales: {} as unknown,
}));

vi.mock('@/features/transactions/hooks/use-my-purchases', () => ({
  useMyPurchases: () => mocks.purchases,
}));

vi.mock('@/features/transactions/hooks/use-my-sales', () => ({
  useMySales: () => mocks.sales,
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    mocks.purchases = { isLoading: false, isError: false, data: { items: [] } };
    mocks.sales = { isLoading: false, isError: false, data: { items: [] } };
  });

  it('shows loading state while purchases load', () => {
    mocks.purchases = { isLoading: true, isError: false, data: undefined };

    render(<HistoryPage />);

    expect(screen.getByText(/cargando historial/i)).toBeVisible();
  });

  it('shows an error instead of empty state when purchases fail', () => {
    mocks.purchases = { isLoading: false, isError: true, data: undefined };

    render(<HistoryPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo cargar/i);
  });
});
