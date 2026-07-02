import { UnauthorizedError } from '@dorsal/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from '../profile-page.client';

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  profile: undefined as unknown,
  profileError: null as unknown,
}));

vi.mock('@/features/users/hooks/use-me', () => ({
  useMe: () => ({
    data: mocks.profile,
    isLoading: false,
    isError: Boolean(mocks.profileError),
    error: mocks.profileError,
  }),
}));

vi.mock('@/features/users/hooks/use-patch-profile', () => ({
  usePatchProfile: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signOut: mocks.signOut,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
    mocks.profile = undefined;
    mocks.profileError = null;
  });

  it('asks the user to sign in again when the backend rejects the stored session', async () => {
    mocks.profileError = new UnauthorizedError();
    const user = userEvent.setup();

    render(<ProfilePage />);

    expect(screen.getByText(/tu sesion ha caducado/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /volver a iniciar sesion/i }));

    await waitFor(() =>
      expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: '/login?callbackUrl=%2Fperfil' }),
    );
  });
});
