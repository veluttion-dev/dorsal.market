import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from '../register-form.client';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  useApi: () => ({ users: { register: mocks.register } }),
}));

vi.mock('next-auth/react', () => ({
  signIn: mocks.signIn,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('callbackUrl=/perfil/completar'),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    mocks.register.mockReset();
    mocks.signIn.mockReset();
  });

  it('starts Cognito sign up when real auth is configured', async () => {
    mocks.signIn.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<RegisterForm cognitoEnabled mockEnabled={false} />);
    await user.click(screen.getByRole('button', { name: /crear cuenta con cognito/i }));

    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith(
        'cognito',
        { callbackUrl: '/perfil/completar' },
        { screen_hint: 'signup' },
      ),
    );
  });

  it('registers a local mocked user and signs in with the dev handoff id', async () => {
    mocks.register.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@example.com',
      name: 'Ana Garcia',
      image: null,
    });
    mocks.signIn.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<RegisterForm cognitoEnabled={false} mockEnabled />);
    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Garcia');
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/^dni/i), '12345678Z');
    await user.selectOptions(screen.getByLabelText(/genero/i), 'female');
    await user.type(screen.getByLabelText(/fecha de nacimiento/i), '1990-01-02');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear cuenta demo/i }));

    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith({
        full_name: 'Ana Garcia',
        email: 'ana@example.com',
        dni: '12345678Z',
        gender: 'female',
        birth_date: '1990-01-02',
        password: 'password123',
      }),
    );
    expect(mocks.signIn).toHaveBeenCalledWith('credentials', {
      email: 'ana@example.com',
      password: 'password123',
      dev_user_id: '11111111-1111-4111-8111-111111111111',
      dev_name: 'Ana Garcia',
      callbackUrl: '/perfil/completar',
    });
  });
});
