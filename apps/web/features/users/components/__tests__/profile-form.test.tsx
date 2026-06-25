import type { UserProfile } from '@dorsal/schemas';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileForm } from '../profile-form.client';

const user: UserProfile = {
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

describe('ProfileForm', () => {
  it('submits only changed fields as a PATCH payload', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const actor = userEvent.setup();

    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.clear(screen.getByLabelText('Nombre'));
    await actor.type(screen.getByLabelText('Nombre'), 'Maria');
    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ first_name: 'Maria' }));
  });

  it('submits the gender contract value while displaying its Spanish label', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const actor = userEvent.setup();

    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.selectOptions(screen.getByRole('combobox', { name: 'Genero' }), 'male');
    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ gender: 'male' }));
  });
});
