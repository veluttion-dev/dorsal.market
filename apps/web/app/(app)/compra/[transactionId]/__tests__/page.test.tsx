import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TransactionTrackingPage from '../page';

const mocks = vi.hoisted(() => ({
  buyer: {} as unknown,
  seller: {} as unknown,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: () => ({ transactionId: '11111111-1111-4111-8111-111111111111' }),
  };
});

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: '22222222-2222-4222-8222-222222222222' } } }),
}));

vi.mock('@/features/transactions/hooks/use-buyer-transaction', () => ({
  useBuyerTransaction: () => mocks.buyer,
}));

vi.mock('@/features/transactions/hooks/use-seller-transaction', () => ({
  useSellerTransaction: () => mocks.seller,
}));

vi.mock('@/components/transaction/confirm-action.client', () => ({
  ConfirmAction: () => <div>Confirm action</div>,
}));

vi.mock('@/components/transaction/transfer-actions.client', () => ({
  TransferActions: () => <div>Transfer actions</div>,
}));

vi.mock('@/components/transaction/tracking-timeline.client', () => ({
  TrackingTimeline: () => <div>Timeline</div>,
}));

vi.mock('@/components/transaction/seller-problem-report.client', () => ({
  SellerProblemReport: () => <div>Seller problem report</div>,
}));

vi.mock('@/features/users/components/review-form.client', () => ({
  ReviewForm: () => <div>Review form</div>,
}));

describe('TransactionTrackingPage', () => {
  beforeEach(() => {
    mocks.buyer = { isLoading: false, isError: false, data: null };
    mocks.seller = { isLoading: false, isError: false, data: null };
  });

  it('shows an explicit error when neither buyer nor seller detail can load', () => {
    mocks.buyer = { isLoading: false, isError: true, data: undefined };
    mocks.seller = { isLoading: false, isError: true, data: undefined };

    render(<TransactionTrackingPage params={Promise.resolve({ transactionId: 'ignored' })} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo cargar el seguimiento/i);
  });
});
