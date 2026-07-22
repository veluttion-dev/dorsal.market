import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewForm } from '../review-form.client';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/features/users/hooks/use-create-review', () => ({
  useCreateReview: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

describe('ReviewForm', () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it('submits a rating for final transactions', async () => {
    mocks.mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(
      <ReviewForm
        transactionId="11111111-1111-4111-8111-111111111111"
        status="RELEASED_TO_SELLER"
      />,
    );

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.type(screen.getByLabelText(/comentario/i), 'Todo perfecto');
    await user.click(screen.getByRole('button', { name: /guardar valoracion/i }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        transaction_id: '11111111-1111-4111-8111-111111111111',
        rating: 5,
        comment: 'Todo perfecto',
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Valoracion guardada');
  });

  it('hides the form and shows a controlled message when review already exists', async () => {
    const error = Object.assign(new Error('HTTP 409'), { status: 409 });
    mocks.mutateAsync.mockRejectedValueOnce(error);
    const user = userEvent.setup();

    render(
      <ReviewForm
        transactionId="11111111-1111-4111-8111-111111111111"
        status="RELEASED_TO_SELLER"
      />,
    );

    await user.click(screen.getByRole('button', { name: /guardar valoracion/i }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith('Ya habias valorado esta operacion'),
    );
    expect(screen.queryByRole('button', { name: /guardar valoracion/i })).not.toBeInTheDocument();
  });

  it('stays hidden until the transaction is reviewable', () => {
    const { container } = render(
      <ReviewForm transactionId="11111111-1111-4111-8111-111111111111" status="PAYMENT_RECEIVED" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
