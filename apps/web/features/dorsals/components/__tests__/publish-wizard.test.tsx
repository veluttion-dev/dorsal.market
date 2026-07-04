import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLISH_DRAFT_STORAGE_KEY } from '../../lib/publish-draft-storage';
import { PublishWizard } from '../publish-wizard.client';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/features/dorsals/hooks/use-publish-dorsal', () => ({
  usePublishDorsal: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock('@/components/form/photo-upload.client', () => ({
  PhotoUpload: ({ onChange }: { onChange: (url: string | null) => void }) => (
    <button type="button" onClick={() => onChange('https://example.com/photo.jpg')}>
      Seleccionar foto test
    </button>
  ),
}));

async function fillPublishForm() {
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Seleccionar foto test' }));
  await user.type(screen.getByLabelText('Nombre carrera'), 'E2E Race');
  await user.type(screen.getByLabelText(/Numero dorsal|Número dorsal/), '999');
  await user.type(screen.getByLabelText('Fecha'), '2027-06-01');
  await user.type(screen.getByLabelText(/Ubicacion|Ubicación/), 'Madrid');
  await user.selectOptions(screen.getByLabelText('Distancia'), '10k');
  await user.type(screen.getByLabelText(/Precio/), '40');
  await user.click(screen.getByText('Bizum'));
  await user.type(screen.getByLabelText(/Telefono|Teléfono/), '600000000');
}

describe('PublishWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.mutate.mockReset();
    mocks.push.mockReset();
  });

  it('shows field-level errors for missing publish fields', async () => {
    const user = userEvent.setup();
    render(<PublishWizard />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar foto test' }));
    await user.click(screen.getByRole('button', { name: 'Publicar dorsal' }));

    expect(await screen.findByText('Introduce el nombre de la carrera')).toBeInTheDocument();
    expect(screen.getByText('Selecciona al menos un metodo de pago')).toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('shows required publish field errors after touching fields without submitting', async () => {
    const user = userEvent.setup();
    render(<PublishWizard />);

    await user.click(screen.getByLabelText('Nombre carrera'));
    await user.tab();

    expect(await screen.findByText('Introduce el nombre de la carrera')).toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('publishes with publish=true after a failed draft attempt', async () => {
    const user = userEvent.setup();
    render(<PublishWizard />);

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await fillPublishForm();
    await user.click(screen.getByRole('button', { name: 'Publicar dorsal' }));

    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          publish: true,
          contact: expect.objectContaining({ phone: '600000000', email: null }),
        }),
        expect.any(Object),
      ),
    );
  });

  it('restores draft fields after navigating away and back', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PublishWizard />);

    await user.type(screen.getByLabelText('Nombre carrera'), 'Carrera guardada');
    await user.type(screen.getByLabelText(/Precio/), '35');
    unmount();

    render(<PublishWizard />);

    expect(screen.getByLabelText('Nombre carrera')).toHaveValue('Carrera guardada');
    expect(screen.getByLabelText(/Precio/)).toHaveValue(35);
  });

  it('does not hydrate a signed-in user with another account legacy draft', () => {
    localStorage.setItem(
      PUBLISH_DRAFT_STORAGE_KEY,
      JSON.stringify({ publish: true, race_name: 'Carrera de otra cuenta' }),
    );

    render(<PublishWizard draftOwnerId="seller-current" />);

    expect(screen.getByLabelText('Nombre carrera')).toHaveValue('');
  });

  it('submits configurable buyer requirements', async () => {
    const user = userEvent.setup();
    render(<PublishWizard />);
    await fillPublishForm();

    await user.click(screen.getByRole('checkbox', { name: 'Solicitar tiempo estimado' }));
    await user.click(screen.getByRole('checkbox', { name: 'Solicitar contacto de emergencia' }));
    await user.click(screen.getByRole('button', { name: 'Publicar dorsal' }));

    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchase_requirements: expect.objectContaining({
            requires_estimated_time: true,
            requires_emergency_contact: true,
          }),
        }),
        expect.any(Object),
      ),
    );
  });

  it('disables buyer shirt-size requests when the listing has a fixed size', async () => {
    const user = userEvent.setup();
    render(<PublishWizard />);

    await user.click(screen.getByRole('checkbox', { name: 'Camiseta' }));
    await user.selectOptions(screen.getByLabelText('Talla incluida'), 'M');

    expect(screen.getByRole('checkbox', { name: 'Solicitar talla al comprador' })).toBeDisabled();
  });
});
