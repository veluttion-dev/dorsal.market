import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyButton } from '../buy-button.client';

const mocks = vi.hoisted(() => ({
  session: null as { user?: { id?: string } } | null,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session }),
}));

describe('BuyButton', () => {
  beforeEach(() => {
    mocks.session = null;
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
});
