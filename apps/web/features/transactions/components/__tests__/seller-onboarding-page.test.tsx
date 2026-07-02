import SellerOnboardingPage from '@/app/(app)/vender/onboarding/page';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutateAsync = vi.fn();

vi.mock('@/features/transactions/hooks/use-onboard-seller', () => ({
  useOnboardSeller: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('@/features/users/hooks/use-me', () => ({
  useMe: () => ({
    data: {
      id: 'local-user-1',
      email: 'seller@example.com',
    },
    isLoading: false,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'cognito-sub-1' } } }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('SellerOnboardingPage', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
  });

  it('shows charges enabled after successful onboarding', async () => {
    mutateAsync.mockResolvedValueOnce({
      account_id: 'acct_1',
      onboarding_url: null,
      charges_enabled: true,
    });
    const user = userEvent.setup();
    render(<SellerOnboardingPage />);

    await user.click(screen.getByRole('button', { name: /Configurar pagos/ }));

    expect(mutateAsync).toHaveBeenCalledWith('local-user-1');
    await waitFor(() => expect(screen.getByText('Cuenta lista para cobrar')).toBeInTheDocument());
  });
});
