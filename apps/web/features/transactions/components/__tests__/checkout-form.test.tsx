import { ApiError } from '@dorsal/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../checkout-form.client';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/features/transactions/hooks/use-reserve-listing', () => ({
  useReserveListing: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

vi.mock('@/features/transactions/lib/stripe', () => ({
  getStripe: () => Promise.resolve(null),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'buyer-1' } } }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError },
}));

describe('CheckoutForm', () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.push.mockReset();
    mocks.toastError.mockReset();
  });

  it('shows backend reservation failures without throwing runtime overlay', async () => {
    mocks.mutateAsync.mockRejectedValueOnce(
      new ApiError('HTTP 400', 400, {
        detail: 'Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)',
      }),
    );
    const user = userEvent.setup();

    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Simular pago|Continuar al pago/ }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)',
      ),
    );
  });
});
