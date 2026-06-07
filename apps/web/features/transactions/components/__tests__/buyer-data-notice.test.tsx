import type { UserProfile } from '@dorsal/schemas';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuyerDataNotice } from '../buyer-data-notice.client';

const completeProfile: UserProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'buyer@example.com',
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

describe('BuyerDataNotice', () => {
  it('explains that profile data will be used by the transfer flow', () => {
    render(<BuyerDataNotice isAuthenticated profile={completeProfile} />);

    expect(screen.getByText(/datos de tu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revisar perfil/i })).toHaveAttribute(
      'href',
      '/perfil',
    );
  });

  it('asks anonymous users to sign in before paying', () => {
    render(<BuyerDataNotice isAuthenticated={false} />);

    expect(screen.getByText(/inicia sesion/i)).toBeInTheDocument();
  });

  it('points incomplete users to the completion screen', () => {
    render(
      <BuyerDataNotice
        isAuthenticated
        profile={{
          ...completeProfile,
          runner_data_complete: false,
          t_shirt_size: null,
          emergency_contact: null,
        }}
      />,
    );

    expect(screen.getByText(/talla de camiseta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revisar perfil/i })).toHaveAttribute(
      'href',
      '/perfil/completar',
    );
  });
});
