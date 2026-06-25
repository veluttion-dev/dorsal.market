import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { mockStore, resetStore } from '../msw';
import { startMockServer } from '../msw/node';

const BASE = 'http://localhost:8000';
const server = startMockServer(['users', 'transactions']);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => resetStore());
afterAll(() => server.close());

describe('MSW runner data contracts', () => {
  it('keeps profile completion independent from race-specific data', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440099';
    const authorization = `Bearer mock:${userId}:ana%40example.com:Ana%20Garcia`;

    const created = await fetch(`${BASE}/api/v1/me`, {
      headers: { authorization },
    });
    expect(created.ok).toBe(true);

    const patched = await fetch(`${BASE}/api/v1/me`, {
      method: 'PATCH',
      headers: {
        authorization,
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        first_name: 'Ana',
        last_name: 'Garcia',
        dni: '12345678Z',
        gender: 'female',
        age: 30,
      }),
    });

    expect(patched.ok).toBe(true);
    expect(await patched.json()).toEqual(
      expect.objectContaining({
        profile_complete: true,
        runner_data_complete: true,
      }),
    );

    mockStore.users.delete(userId);
  });

  it('snapshots checkout runner data in the seller transaction detail', async () => {
    const reservation = await fetch(`${BASE}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        buyer_id: mockStore.SEED_USER_ID,
        runner_data: {
          estimated_time: '02:10:00',
          t_shirt_size: 'M',
          emergency_contact: 'Solo esta compra',
        },
      }),
    });
    const { transaction_id: transactionId } = (await reservation.json()) as {
      transaction_id: string;
    };

    const detail = await fetch(`${BASE}/api/v1/transactions/seller/${transactionId}`);

    expect(detail.ok).toBe(true);
    expect(await detail.json()).toEqual(
      expect.objectContaining({
        buyer_profile: expect.objectContaining({
          estimated_time: '02:10:00',
          t_shirt_size: 'M',
          emergency_contact: 'Solo esta compra',
        }),
      }),
    );
  });
});
