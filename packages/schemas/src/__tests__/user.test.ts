import { describe, expect, it } from 'vitest';
import { PatchUserProfileInput, PublicUserProfile, UserProfile } from '../user';

describe('UserProfile', () => {
  it('parses the backend private profile contract', () => {
    const parsed = UserProfile.parse({
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
    });

    expect(parsed.runner_data_complete).toBe(true);
    expect(parsed.estimated_time).toBe('01:35:00');
  });
});

describe('PatchUserProfileInput', () => {
  it('accepts partial updates and explicit nulls', () => {
    expect(
      PatchUserProfileInput.parse({
        first_name: 'Ana',
        estimated_time: null,
        emergency_contact: '+34600999888',
      }),
    ).toEqual({
      first_name: 'Ana',
      estimated_time: null,
      emergency_contact: '+34600999888',
    });
  });

  it('rejects malformed estimated_time values', () => {
    expect(() => PatchUserProfileInput.parse({ estimated_time: '1:35' })).toThrow();
  });
});

describe('PublicUserProfile', () => {
  it('parses public profile fields without private identity data', () => {
    const parsed = PublicUserProfile.parse({
      id: '550e8400-e29b-41d4-a716-446655440001',
      full_name: 'Ana Runner',
      avg_rating_seller: '4.80',
      avg_rating_buyer: null,
      total_sales: 3,
      total_purchases: 1,
      profile_complete: true,
    });

    expect(parsed.avg_rating_seller).toBe(4.8);
    expect('dni' in parsed).toBe(false);
  });
});
