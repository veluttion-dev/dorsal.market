import { ApiError, UnauthorizedError } from '@dorsal/api-client';
import type { DorsalDetail, UserProfile } from '@dorsal/schemas';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../checkout-form.client';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  updateRunnerDataMutateAsync: vi.fn(),
  expireMutateAsync: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
  currentProfile: undefined as UserProfile | undefined,
  profileError: null as unknown,
}));

vi.mock('@/features/transactions/hooks/use-reserve-listing', () => ({
  useReserveListing: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

vi.mock('@/features/transactions/hooks/use-expire-reservation', () => ({
  useExpireReservation: () => ({ mutateAsync: mocks.expireMutateAsync, isPending: false }),
}));

vi.mock('@/features/transactions/hooks/use-update-checkout-runner-data', () => ({
  useUpdateCheckoutRunnerData: () => ({
    mutateAsync: mocks.updateRunnerDataMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/features/transactions/lib/stripe', () => ({
  getStripe: () => Promise.resolve(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? {} : null),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div>Formulario de tarjeta</div>,
  useElements: () => ({}),
  useStripe: () => ({
    confirmPayment: vi.fn(async () => ({})),
  }),
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

function makeDorsal(overrides: Partial<DorsalDetail> = {}): DorsalDetail {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    seller_id: '22222222-2222-4222-8222-222222222222',
    photo_url: 'https://example.com/photos/madrid.jpg',
    race_name: 'San Silvestre Vallecana',
    bib_number: 'A-1234',
    race_date: '2026-12-31',
    location: 'Madrid',
    distance: '10k',
    start_corral: 'B',
    included_items: {
      chip: true,
      shirt: true,
      bag: false,
      medal: true,
      refreshments: true,
    },
    purchase_requirements: {
      requires_estimated_time: false,
      requires_shirt_size: false,
      requires_emergency_contact: false,
      fixed_shirt_size: null,
    },
    price_amount: 35,
    contact_phone: '612345678',
    contact_email: 'ana.runner@example.com',
    sale_reason: 'Lesion muscular, no puedo correr',
    status: 'published',
    created_at: '2026-06-20T09:58:41.674225Z',
    updated_at: '2026-06-27T00:53:19.933388Z',
    ...overrides,
  };
}

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.useRealTimers();
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = '';
    sessionStorage.clear();
    mocks.mutateAsync.mockReset();
    mocks.updateRunnerDataMutateAsync.mockReset();
    mocks.expireMutateAsync.mockReset();
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

  it('redirects home when another buyer has already reserved the dorsal', async () => {
    mocks.mutateAsync.mockRejectedValueOnce(
      new ApiError('HTTP 400', 400, {
        detail: 'Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: reserved)',
      }),
    );

    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Este dorsal ya esta reservado por otra persona. Te devolvemos al catalogo.',
      ),
    );
    expect(mocks.push).toHaveBeenCalledWith('/');
  });

  it('redirects to profile completion before reserving when identity is incomplete', async () => {
    if (!mocks.currentProfile) {
      throw new Error('Expected profile fixture to be initialized');
    }
    mocks.currentProfile = {
      ...mocks.currentProfile,
      profile_complete: false,
    };

    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Completa tus datos de identidad antes de comprar',
      ),
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(
      '/perfil/completar?callbackUrl=%2Fcompra%2Fcheckout%2F55555555-5555-4555-8555-555555555555',
    );
  });

  it('renders only the runner fields requested by the dorsal', () => {
    render(
      <CheckoutForm
        dorsal={makeDorsal({
          purchase_requirements: {
            requires_estimated_time: true,
            requires_shirt_size: false,
            requires_emergency_contact: true,
            fixed_shirt_size: null,
          },
        })}
      />,
    );

    expect(screen.getByLabelText('Tiempo estimado')).toBeVisible();
    expect(screen.queryByLabelText('Talla')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Contacto de emergencia')).toHaveValue('Pedro 600000001');
  });

  it('explains when Stripe is not configured locally', () => {
    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    expect(screen.getByText(/pago seguro con stripe/i)).toBeVisible();
    expect(screen.getByText(/stripe no esta configurado/i)).toBeVisible();
    expect(screen.getByText(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/i)).toBeVisible();
  });

  it('does not redirect to profile completion when the stored session is rejected', async () => {
    mocks.currentProfile = undefined;
    mocks.profileError = new UnauthorizedError();

    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Tu sesion ha caducado. Vuelve a iniciar sesion para continuar.',
      ),
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalledWith(
      '/perfil/completar?callbackUrl=%2Fcompra%2Fcheckout%2F55555555-5555-4555-8555-555555555555',
    );
  });

  it('reserves automatically when the authenticated buyer enters checkout', async () => {
    mocks.mutateAsync.mockResolvedValueOnce({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'secret',
      reservation_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        dorsalId: '55555555-5555-4555-8555-555555555555',
      }),
    );
    expect(await screen.findByText('Reserva activa')).toBeVisible();
  });

  it('sends edited runner data only before payment', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    mocks.mutateAsync.mockResolvedValueOnce({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'secret',
      reservation_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    mocks.updateRunnerDataMutateAsync.mockResolvedValueOnce({ processed: true });
    const user = userEvent.setup();
    render(
      <CheckoutForm
        dorsal={makeDorsal({
          purchase_requirements: {
            requires_estimated_time: true,
            requires_shirt_size: false,
            requires_emergency_contact: true,
            fixed_shirt_size: null,
          },
        })}
      />,
    );

    expect(await screen.findByText('Reserva activa')).toBeVisible();
    await user.type(screen.getByLabelText('Tiempo estimado'), '01:45:00');
    await user.clear(screen.getByLabelText('Contacto de emergencia'));
    await user.type(screen.getByLabelText('Contacto de emergencia'), 'Solo esta compra');
    await user.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() =>
      expect(mocks.updateRunnerDataMutateAsync).toHaveBeenCalledWith({
        transactionId: '11111111-1111-4111-8111-111111111111',
        runnerData: {
          estimated_time: '01:45:00',
          emergency_contact: 'Solo esta compra',
        },
      }),
    );
    expect(mocks.currentProfile?.emergency_contact).toBe('Pedro 600000001');
  });

  it('restores runner data after returning from a login redirect', async () => {
    const user = userEvent.setup();
    const props = {
      dorsal: makeDorsal({
        race_name: 'Madrid',
        purchase_requirements: {
          requires_estimated_time: true,
          requires_shirt_size: true,
          requires_emergency_contact: true,
          fixed_shirt_size: null,
        },
      }),
    };

    const { unmount } = render(<CheckoutForm {...props} />);

    await user.type(screen.getByLabelText('Tiempo estimado'), '01:45:00');
    await user.selectOptions(screen.getByLabelText('Talla'), 'M');
    await user.clear(screen.getByLabelText('Contacto de emergencia'));
    await user.type(screen.getByLabelText('Contacto de emergencia'), 'Solo esta compra');

    unmount();
    render(<CheckoutForm {...props} />);

    expect(screen.getByLabelText('Tiempo estimado')).toHaveValue('01:45:00');
    expect(screen.getByLabelText('Talla')).toHaveValue('M');
    expect(screen.getByLabelText('Contacto de emergencia')).toHaveValue('Solo esta compra');
  });

  it('shows a detailed pre-payment review with missing buyer data fields', () => {
    render(
      <CheckoutForm
        dorsal={makeDorsal({
          purchase_requirements: {
            requires_estimated_time: true,
            requires_shirt_size: true,
            requires_emergency_contact: true,
            fixed_shirt_size: null,
          },
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'San Silvestre Vallecana' })).toBeVisible();
    expect(screen.getByText('31 dic 2026')).toBeVisible();
    expect(screen.getByText('Madrid')).toBeVisible();
    expect(screen.getByText('10K')).toBeVisible();
    expect(screen.getByText('A-1234')).toBeVisible();
    expect(screen.getByText('B')).toBeVisible();
    expect(screen.getByText('Lesion muscular, no puedo correr')).toBeVisible();
    expect(screen.getByText('612345678')).toBeVisible();
    expect(screen.getByText('ana.runner@example.com')).toBeVisible();
    expect(screen.getByText(/pago seguro con stripe/i)).toBeVisible();
    expect(screen.getByText('Camiseta')).toBeVisible();
    expect(screen.getByLabelText('Tiempo estimado')).toBeVisible();
    expect(screen.getByLabelText('Talla')).toBeVisible();
    expect(screen.getByLabelText('Contacto de emergencia')).toBeVisible();
  });

  it('shows an active reservation countdown and releases it when time runs out', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    mocks.mutateAsync.mockResolvedValueOnce({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'secret',
      reservation_expires_at: new Date(Date.now() + 1500).toISOString(),
    });
    mocks.expireMutateAsync.mockResolvedValueOnce({ processed: true });

    render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    expect(await screen.findByText('Reserva activa')).toBeVisible();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeVisible();

    await waitFor(
      () =>
        expect(mocks.expireMutateAsync).toHaveBeenCalledWith(
          '11111111-1111-4111-8111-111111111111',
        ),
      { timeout: 2500 },
    );
    expect(mocks.push).toHaveBeenCalledWith('/');
  });

  it('releases the active reservation when the buyer leaves checkout before paying', async () => {
    mocks.mutateAsync.mockResolvedValueOnce({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'secret',
      reservation_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    mocks.expireMutateAsync.mockResolvedValueOnce({ processed: true });

    const { unmount } = render(<CheckoutForm dorsal={makeDorsal({ race_name: 'Madrid' })} />);

    expect(await screen.findByText('Reserva activa')).toBeVisible();
    unmount();

    await waitFor(() =>
      expect(mocks.expireMutateAsync).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111'),
    );
    expect(
      sessionStorage.getItem(
        'dorsal.market.checkout-reservation.v1.55555555-5555-4555-8555-555555555555',
      ),
    ).toBeNull();
    expect(mocks.push).not.toHaveBeenCalledWith('/');
  });
});
