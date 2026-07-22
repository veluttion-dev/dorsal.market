import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from '../notification-bell.client';

const mocks = vi.hoisted(() => ({
  notifications: {} as unknown,
}));

vi.mock('@/features/notifications/hooks/use-my-notifications', () => ({
  useMyNotifications: () => mocks.notifications,
}));

describe('NotificationBell', () => {
  it('shows unread count and links to the notification center', () => {
    mocks.notifications = {
      data: {
        unread_count: 2,
        items: [],
      },
      isLoading: false,
      isError: false,
    };

    render(<NotificationBell />);

    expect(screen.getByRole('link', { name: /notificaciones/i })).toHaveAttribute(
      'href',
      '/perfil/notificaciones',
    );
    expect(screen.getByText('2')).toBeVisible();
  });
});
