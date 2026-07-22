import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavMobile } from '../nav-mobile.client';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('NavMobile', () => {
  it('exposes an accessible trigger and keeps the menu closed initially', () => {
    render(<NavMobile session={null} />);

    expect(screen.getByRole('button', { name: /abrir menú/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the menu with the primary links', async () => {
    const user = userEvent.setup();
    render(<NavMobile session={null} />);

    await user.click(screen.getByRole('button', { name: /abrir menú/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vender' })).toHaveAttribute('href', '/vender');
    expect(screen.getByRole('link', { name: 'Cómo comprar' })).toHaveAttribute(
      'href',
      '/guias/comprar',
    );
  });

  it('shows auth actions for anonymous and signed-in users', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<NavMobile session={null} />);

    await user.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');

    rerender(<NavMobile session={{ user: { name: 'Runner Demo' } }} />);
    expect(screen.getByRole('link', { name: 'Notificaciones' })).toHaveAttribute(
      'href',
      '/perfil/notificaciones',
    );
    expect(screen.getByRole('link', { name: 'Runner Demo' })).toHaveAttribute('href', '/perfil');
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
  });
});
