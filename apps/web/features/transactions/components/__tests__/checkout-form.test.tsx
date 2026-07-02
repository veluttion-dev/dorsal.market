import { ApiError, UnauthorizedError } from '@dorsal/api-client';
import type { UserProfile } from '@dorsal/schemas';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../checkout-form.client';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
  currentProfile: undefined as UserProfile | undefined,
  profileError: null as unknown,
}));

vi.mock('@/features/transactions/hooks/use-reserve-listing', () => ({
  useReserveListing: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

vi.mock('@/features/transactions/lib/stripe', () => ({
  getStripe: () => Promise.resolve(null),
}));

vi.mock('@/features/users/hooks/use-me', () => ({
  useMe: () => ({
    data: mocks.currentProfile,
    isLoading: false,
    isError: Boolean(mocks.profileError),
    error: mocks.profileError,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'cognito-sub-1' } } }),
  signOut: vi.fn(),
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
    mocks.profileError = null;
    mocks.currentProfile = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'buyer@example.com',
      first_name: 'Ana',
      last_name: 'Garcia',
      dni: '12345678Z',
      gender: 'female',
      age: 34,
      phone_number: '600000000',
      whatsapp_number: '600000000',
      postal_code: '28001',
      address: 'Calle Mayor 1',
      estimated_time: '01:45:00',
      t_shirt_size: 'M',
      club: null,
      federation_license: null,
      medical_info: null,
      emergency_contact: 'Pedro 600000001',
      additional_info: null,
      profile_complete: true,
      runner_data_complete: true,
    };
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

  it('redirects to profile completion before reserving when identity is incomplete', async () => {
    if (!mocks.currentProfile) {
      throw new Error('Expected profile fixture to be initialized');
    }
    mocks.currentProfile = {
      ...mocks.currentProfile,
      profile_complete: false,
    };
    const user = userEvent.setup();

    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Simular pago|Continuar al pago/ }));

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Completa tus datos de identidad antes de comprar',
    );
    expect(mocks.push).toHaveBeenCalledWith(
      '/perfil/completar?callbackUrl=%2Fcompra%2Fcheckout%2F55555555-5555-4555-8555-555555555555',
    );
  });

  it('renders only the runner fields requested by the dorsal', () => {
    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
        purchaseRequirements={{
          requires_estimated_time: true,
          requires_shirt_size: false,
          requires_emergency_contact: true,
          fixed_shirt_size: null,
        }}
      />,
    );

    expect(screen.getByLabelText('Tiempo estimado')).toBeVisible();
    expect(screen.queryByLabelText('Talla')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Contacto de emergencia')).toHaveValue('Pedro 600000001');
  });

  it('explains when Stripe is not configured locally', () => {
    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
      />,
    );

    expect(screen.getByText(/stripe no esta configurado/i)).toBeVisible();
    expect(screen.getByText(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/i)).toBeVisible();
  });

  it('does not redirect to profile completion when the stored session is rejected', async () => {
    mocks.currentProfile = undefined;
    mocks.profileError = new UnauthorizedError();
    const user = userEvent.setup();

    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Simular pago|Continuar al pago/ }));

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalledWith(
      '/perfil/completar?callbackUrl=%2Fcompra%2Fcheckout%2F55555555-5555-4555-8555-555555555555',
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Tu sesion ha caducado. Vuelve a iniciar sesion para continuar.',
    );
  });

  it('sends edited runner data only to the reservation', async () => {
    mocks.mutateAsync.mockResolvedValueOnce({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'secret',
      reservation_expires_at: '2026-06-26T12:00:00Z',
    });
    const user = userEvent.setup();
    render(
      <CheckoutForm
        dorsalId="55555555-5555-4555-8555-555555555555"
        raceName="Madrid"
        amount={35}
        purchaseRequirements={{
          requires_estimated_time: true,
          requires_shirt_size: false,
          requires_emergency_contact: true,
          fixed_shirt_size: null,
        }}
      />,
    );

    await user.type(screen.getByLabelText('Tiempo estimado'), '01:45:00');
    await user.clear(screen.getByLabelText('Contacto de emergencia'));
    await user.type(screen.getByLabelText('Contacto de emergencia'), 'Solo esta compra');
    await user.click(screen.getByRole('button', { name: /Simular pago|Continuar al pago/ }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        dorsalId: '55555555-5555-4555-8555-555555555555',
        buyerId: '11111111-1111-4111-8111-111111111111',
        runnerData: {
          estimated_time: '01:45:00',
          emergency_contact: 'Solo esta compra',
        },
      }),
    );
    expect(mocks.currentProfile?.emergency_contact).toBe('Pedro 600000001');
  });
});
