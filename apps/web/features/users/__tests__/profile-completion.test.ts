import type { UserProfile } from '@dorsal/schemas';
import { describe, expect, it } from 'vitest';
import { canBuyWithProfile, getMissingProfileFields } from '../lib/profile-completion';

const completeUser: UserProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'runner@example.com',
  first_name: 'Ana',
  last_name: 'Garcia',
  dni: '12345678Z',
  gender: 'female',
  age: 34,
  phone_number: '600000000',
  whatsapp_number: '600000000',
  postal_code: '28001',
  address: 'Calle Mayor 1',
  estimated_time: '01:45:00',
  t_shirt_size: 'M',
  club: null,
  federation_license: null,
  medical_info: null,
  emergency_contact: 'Pedro 600000001',
  additional_info: null,
  profile_complete: true,
  runner_data_complete: true,
};

describe('profile completion', () => {
  it('allows buying when identity profile completion is true', () => {
    expect(canBuyWithProfile(completeUser)).toBe(true);
    expect(canBuyWithProfile({ ...completeUser, profile_complete: false })).toBe(false);
    expect(canBuyWithProfile({ ...completeUser, runner_data_complete: false })).toBe(true);
    expect(canBuyWithProfile(null)).toBe(false);
  });

  it('does not list race-specific runner fields as missing profile data', () => {
    expect(
      getMissingProfileFields({
        ...completeUser,
        estimated_time: null,
        t_shirt_size: null,
        emergency_contact: null,
      }),
    ).toEqual([]);
  });

  it('mentions identity data when backend profile_complete is false', () => {
    expect(
      getMissingProfileFields({
        ...completeUser,
        first_name: null,
        profile_complete: false,
      }),
    ).toContain('Datos de identidad');
  });
});
