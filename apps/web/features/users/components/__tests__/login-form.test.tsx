import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../login-form.client';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: mocks.signIn,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('callbackUrl=/perfil'),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
  });

  it('starts Cognito sign in with the callback url', async () => {
    mocks.signIn.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginForm cognitoEnabled mockEnabled={false} />);
    await user.click(screen.getByRole('button', { name: /entrar con cognito/i }));

    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith('cognito', {
        callbackUrl: '/perfil',
        redirectTo: '/perfil',
      }),
    );
  });

  it('offers a local demo login only when users are mocked', async () => {
    mocks.signIn.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginForm cognitoEnabled={false} mockEnabled />);
    await user.click(screen.getByRole('button', { name: /entrar como demo/i }));

    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith('credentials', {
        email: 'demo@dorsal.market',
        password: 'demo1234',
        callbackUrl: '/perfil',
        redirectTo: '/perfil',
      }),
    );
  });
});
