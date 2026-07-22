import { describe, expect, it, vi } from 'vitest';
import { NotificationsHttpAdapter } from '../adapters';
import type { HttpClient } from '../http';

function createHttpStub(overrides: Partial<Record<keyof HttpClient, unknown>> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as HttpClient;
}

describe('NotificationsHttpAdapter', () => {
  it('lists my notifications through the authenticated backend endpoint', async () => {
    const get = vi.fn(async () => ({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          user_id: '22222222-2222-4222-8222-222222222222',
          type: 'buyer_data_available',
          title: 'Nueva venta pagada',
          body: 'El comprador ya ha pagado.',
          transaction_id: '33333333-3333-4333-8333-333333333333',
          href: '/compra/33333333-3333-4333-8333-333333333333',
          read_at: null,
          created_at: '2026-07-20T10:00:00Z',
        },
      ],
      unread_count: 1,
      limit: 20,
      offset: 0,
    }));
    const adapter = new NotificationsHttpAdapter(createHttpStub({ get }));

    const result = await adapter.listMyNotifications({ limit: 20, offset: 0 });

    expect(get).toHaveBeenCalledWith('api/v1/me/notifications', {
      query: { limit: 20, offset: 0 },
    });
    expect(result.unread_count).toBe(1);
    expect(result.items.at(0)?.href).toBe('/compra/33333333-3333-4333-8333-333333333333');
  });

  it('marks a notification read through the authenticated backend endpoint', async () => {
    const post = vi.fn(async () => ({
      notification_id: '11111111-1111-4111-8111-111111111111',
      read_at: '2026-07-20T12:00:00Z',
    }));
    const adapter = new NotificationsHttpAdapter(createHttpStub({ post }));

    const result = await adapter.markRead('11111111-1111-4111-8111-111111111111');

    expect(post).toHaveBeenCalledWith(
      'api/v1/me/notifications/11111111-1111-4111-8111-111111111111/read',
    );
    expect(result.notification_id).toBe('11111111-1111-4111-8111-111111111111');
  });
});
