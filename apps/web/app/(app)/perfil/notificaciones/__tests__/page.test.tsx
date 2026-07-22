import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationsPage from '../page';

const mocks = vi.hoisted(() => ({
  notifications: {} as unknown,
  markRead: vi.fn(),
}));

vi.mock('@/features/notifications/hooks/use-my-notifications', () => ({
  useMyNotifications: () => mocks.notifications,
}));

vi.mock('@/features/notifications/hooks/use-mark-notification-read', () => ({
  useMarkNotificationRead: () => ({ mutate: mocks.markRead, isPending: false }),
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    mocks.markRead.mockReset();
    mocks.notifications = {
      isLoading: false,
      isError: false,
      data: {
        unread_count: 1,
        limit: 20,
        offset: 0,
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            user_id: '22222222-2222-4222-8222-222222222222',
            type: 'transfer_proof_submitted',
            title: 'Cambio enviado para validar',
            body: 'El vendedor ha subido la prueba del cambio.',
            transaction_id: '33333333-3333-4333-8333-333333333333',
            href: '/compra/33333333-3333-4333-8333-333333333333',
            read_at: null,
            created_at: '2026-07-20T10:00:00Z',
          },
        ],
      },
    };
  });

  it('renders notification actions that take the user to tracking', () => {
    render(<NotificationsPage />);

    expect(screen.getByRole('heading', { name: /notificaciones/i })).toBeVisible();
    expect(screen.getByText('Cambio enviado para validar')).toBeVisible();
    expect(screen.getByRole('link', { name: /abrir seguimiento/i })).toHaveAttribute(
      'href',
      '/compra/33333333-3333-4333-8333-333333333333',
    );
  });

  it('marks an unread notification as read', async () => {
    const user = userEvent.setup();
    render(<NotificationsPage />);

    await user.click(screen.getByRole('button', { name: /marcar como leida/i }));

    expect(mocks.markRead).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
    expect(screen.queryByText('Cambio enviado para validar')).not.toBeInTheDocument();
  });

  it('marks a notification as read when opening tracking', async () => {
    const user = userEvent.setup();
    render(<NotificationsPage />);

    await user.click(screen.getByRole('link', { name: /abrir seguimiento/i }));

    expect(mocks.markRead).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('hides notifications that are already read', () => {
    mocks.notifications = {
      isLoading: false,
      isError: false,
      data: {
        unread_count: 0,
        limit: 20,
        offset: 0,
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            user_id: '22222222-2222-4222-8222-222222222222',
            type: 'transfer_proof_submitted',
            title: 'Cambio enviado para validar',
            body: 'El vendedor ha subido la prueba del cambio.',
            transaction_id: '33333333-3333-4333-8333-333333333333',
            href: '/compra/33333333-3333-4333-8333-333333333333',
            read_at: '2026-07-20T11:00:00Z',
            created_at: '2026-07-20T10:00:00Z',
          },
        ],
      },
    };

    render(<NotificationsPage />);

    expect(screen.queryByText('Cambio enviado para validar')).not.toBeInTheDocument();
    expect(screen.getByText('No tienes notificaciones.')).toBeVisible();
  });
});
