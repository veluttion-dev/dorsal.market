import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmAction } from '../confirm-action.client';

vi.mock('@/features/transactions/hooks/use-confirm-transfer', () => ({
  useConfirmTransfer: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/components/transaction/dispute-dialog.client', () => ({
  DisputeDialog: () => <button type="button">Abrir disputa</button>,
}));

describe('ConfirmAction', () => {
  it('does not allow buyer confirmation while the seller transfer is only in progress', () => {
    render(
      <ConfirmAction
        transactionId="11111111-1111-4111-8111-111111111111"
        status="TRANSFER_IN_PROGRESS"
      />,
    );

    expect(screen.queryByRole('button', { name: /confirmar cambio/i })).not.toBeInTheDocument();
  });

  it('allows buyer confirmation after the seller submits transfer proof', () => {
    render(
      <ConfirmAction
        transactionId="11111111-1111-4111-8111-111111111111"
        status="TRANSFER_SUBMITTED"
      />,
    );

    expect(screen.getByRole('button', { name: /confirmar cambio/i })).toBeVisible();
  });
});
