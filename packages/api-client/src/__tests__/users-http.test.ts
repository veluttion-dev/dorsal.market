import { describe, expect, it, vi } from 'vitest';
import { UsersHttpAdapter } from '../adapters/users-http';
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

const privateProfile = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'ana@example.com',
  first_name: 'Ana',
  last_name: 'Runner',
  dni: '12345678Z',
  gender: 'female',
  age: 32,
  phone_number: '600000000',
  whatsapp_number: '600000000',
  postal_code: '28001',
  address: 'Calle Mayor 1',
  estimated_time: '01:35:00',
  t_shirt_size: 'M',
  club: null,
  federation_license: null,
  medical_info: null,
  emergency_contact: '+34600999888',
  additional_info: null,
  profile_complete: true,
  runner_data_complete: true,
};

describe('UsersHttpAdapter', () => {
  it('gets the current profile from the backend /me route', async () => {
    const get = vi.fn(async () => privateProfile);
    const adapter = new UsersHttpAdapter(createHttpStub({ get }));

    const result = await adapter.getMe();

    expect(get).toHaveBeenCalledWith('api/v1/me');
    expect(result.runner_data_complete).toBe(true);
  });

  it('patches only profile fields sent by the caller', async () => {
    const patch = vi.fn(async () => ({ ...privateProfile, first_name: 'Maria' }));
    const adapter = new UsersHttpAdapter(createHttpStub({ patch }));

    await adapter.patchMe({ first_name: 'Maria' });

    expect(patch).toHaveBeenCalledWith('api/v1/me', { body: { first_name: 'Maria' } });
  });

  it('gets a public profile from the backend public route', async () => {
    const get = vi.fn(async () => ({
      id: '550e8400-e29b-41d4-a716-446655440001',
      full_name: 'Ana Runner',
      avg_rating_seller: '4.80',
      avg_rating_buyer: null,
      total_sales: 3,
      total_purchases: 1,
      profile_complete: true,
    }));
    const adapter = new UsersHttpAdapter(createHttpStub({ get }));

    const result = await adapter.getPublicProfile('550e8400-e29b-41d4-a716-446655440001');

    expect(get).toHaveBeenCalledWith('api/v1/users/550e8400-e29b-41d4-a716-446655440001/public');
    expect(result.avg_rating_seller).toBe(4.8);
  });
});
