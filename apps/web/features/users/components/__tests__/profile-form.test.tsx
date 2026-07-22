import { ApiError } from '@dorsal/api-client';
import type { UserProfile } from '@dorsal/schemas';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('keeps race-specific time and shirt size out of the profile', () => {
    render(<ProfileForm user={user} onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText('Tiempo estimado')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Talla camiseta')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Contacto de emergencia (opcional)')).toBeVisible();
    expect(screen.getByText('* Campos obligatorios')).toBeVisible();
  });

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

    await actor.click(screen.getByRole('combobox', { name: 'Genero' }));
    await actor.click(await screen.findByRole('option', { name: 'Masculino' }));
    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ gender: 'male' }));
  });
  it('shows a DNI validation error before submitting malformed values', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const actor = userEvent.setup();

    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.clear(screen.getByLabelText('DNI'));
    await actor.type(screen.getByLabelText('DNI'), '888888888L');
    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByText('El DNI debe tener 8 numeros y una letra')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a DNI validation error while editing without submitting', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const actor = userEvent.setup();

    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.clear(screen.getByLabelText('DNI'));
    await actor.type(screen.getByLabelText('DNI'), '888888888L');

    expect(await screen.findByText('El DNI debe tener 8 numeros y una letra')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows field validation errors for values the backend would reject', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const actor = userEvent.setup();
    const incompleteUser: UserProfile = {
      ...user,
      first_name: '',
      last_name: '',
      dni: '',
      gender: null,
      age: null,
    };

    render(<ProfileForm user={incompleteUser} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Telefono'), { target: { value: '1'.repeat(33) } });
    fireEvent.change(screen.getByLabelText('Codigo postal'), { target: { value: '1'.repeat(21) } });
    fireEvent.change(screen.getByLabelText('Direccion'), { target: { value: 'a'.repeat(256) } });
    fireEvent.change(screen.getByLabelText('Contacto de emergencia (opcional)'), {
      target: { value: 'a'.repeat(121) },
    });
    fireEvent.change(screen.getByLabelText('Club'), { target: { value: 'a'.repeat(121) } });
    fireEvent.change(screen.getByLabelText('Licencia federativa'), {
      target: { value: 'a'.repeat(121) },
    });
    fireEvent.change(screen.getByLabelText('Informacion medica'), {
      target: { value: 'a'.repeat(501) },
    });
    fireEvent.change(screen.getByLabelText('Informacion adicional'), {
      target: { value: 'a'.repeat(501) },
    });

    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeVisible();
    expect(screen.getByText('Los apellidos son obligatorios')).toBeVisible();
    expect(screen.getByText('El DNI es obligatorio')).toBeVisible();
    expect(screen.getByText('Selecciona un genero')).toBeVisible();
    expect(screen.getByText('La edad es obligatoria')).toBeVisible();
    expect(screen.getByText('El telefono no puede superar 32 caracteres')).toBeVisible();
    expect(screen.getByText('El codigo postal no puede superar 20 caracteres')).toBeVisible();
    expect(screen.getByText('La direccion no puede superar 255 caracteres')).toBeVisible();
    expect(
      screen.getByText('El contacto de emergencia no puede superar 120 caracteres'),
    ).toBeVisible();
    expect(screen.getByText('El club no puede superar 120 caracteres')).toBeVisible();
    expect(
      screen.getByText('La licencia federativa no puede superar 120 caracteres'),
    ).toBeVisible();
    expect(screen.getByText('La informacion medica no puede superar 500 caracteres')).toBeVisible();
    expect(
      screen.getByText('La informacion adicional no puede superar 500 caracteres'),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('re-enables saving after a rejected submission', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('failed');
    });
    const actor = userEvent.setup();
    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeEnabled(),
    );
  });

  it('shows backend detail when profile save is rejected', async () => {
    const onSubmit = vi.fn(async () => {
      throw new ApiError('HTTP 409', 409, { detail: 'DNI is already linked to another user' });
    });
    const actor = userEvent.setup();
    render(<ProfileForm user={user} onSubmit={onSubmit} />);

    await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByText('DNI is already linked to another user')).toBeVisible();
  });
});
