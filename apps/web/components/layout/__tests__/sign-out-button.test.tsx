import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignOutButton } from '../sign-out-button.client';

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: mocks.signOut,
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
  });

  it('signs out through the local Cognito logout bridge', async () => {
    mocks.signOut.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /salir/i }));

    await waitFor(() =>
      expect(mocks.signOut).toHaveBeenCalledWith({
        callbackUrl: '/api/auth/cognito/logout?returnTo=%2F',
      }),
    );
  });
});
