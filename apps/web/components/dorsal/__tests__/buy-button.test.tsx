import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyButton } from '../buy-button.client';

const mocks = vi.hoisted(() => ({
  session: null as { user?: { id?: string } } | null,
  localUserId: null as string | null,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session }),
}));

vi.mock('@/features/users/hooks/use-me', () => ({
  useMe: () => ({ data: mocks.localUserId ? { id: mocks.localUserId } : null }),
}));

describe('BuyButton', () => {
  beforeEach(() => {
    mocks.session = null;
    mocks.localUserId = null;
  });

  it('links anonymous buyers to login with checkout callback', () => {
    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="published"
      />,
    );

    expect(screen.getByRole('link', { name: /comprar dorsal/i })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Fcompra%2Fcheckout%2F550e8400-e29b-41d4-a716-446655440010',
    );
  });

  it('links authenticated buyers directly to checkout', () => {
    mocks.session = { user: { id: 'buyer-1' } };

    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="published"
      />,
    );

    expect(screen.getByRole('link', { name: /comprar dorsal/i })).toHaveAttribute(
      'href',
      '/compra/checkout/550e8400-e29b-41d4-a716-446655440010',
    );
  });

  it('keeps unavailable dorsals disabled', () => {
    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="sold"
      />,
    );

    expect(screen.getByRole('button', { name: /no disponible/i })).toBeDisabled();
  });

  it('keeps own dorsals disabled using the local backend user id', () => {
    mocks.session = { user: { id: 'cognito-sub-1' } };
    mocks.localUserId = 'local-seller-1';

    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="local-seller-1"
        status="published"
      />,
    );

    expect(screen.getByRole('button', { name: /es tu dorsal/i })).toBeDisabled();
  });
});
