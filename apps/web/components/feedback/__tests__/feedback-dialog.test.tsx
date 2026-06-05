import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackDialog } from '../feedback-dialog.client';

const mocks = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

describe('FeedbackDialog', () => {
  beforeEach(() => {
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    vi.restoreAllMocks();
  });

  it('guides users toward concrete actionable feedback', () => {
    render(<FeedbackDialog open onOpenChange={() => {}} />);

    expect(screen.getByText(/feedback concreto/i)).toBeInTheDocument();
    expect(screen.getByText(/partes del proceso que no se entienden/i)).toBeInTheDocument();
  });

  it('connects the optional contact email input to its helper text', () => {
    render(<FeedbackDialog open onOpenChange={() => {}} />);

    const emailInput = screen.getByLabelText(/email de contacto/i);
    const helperText = screen.getByText(/solo lo usaremos/i);

    expect(helperText.id).toBeTruthy();
    expect(emailInput).toHaveAttribute('aria-describedby', helperText.id);
  });

  it('requires a useful message before sending', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/mensaje/i), 'Corto');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    expect(await screen.findByText(/escribe al menos 20 caracteres/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts valid feedback and closes on success', async () => {
    const onOpenChange = vi.fn();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const user = userEvent.setup();
    window.history.pushState({}, '', '/feedback-dialog-test?source=vitest');

    render(<FeedbackDialog open onOpenChange={onOpenChange} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      '  No entiendo que ocurre despues de simular el pago de un dorsal.  ',
    );
    await user.type(screen.getByLabelText(/email de contacto/i), '  runner@example.com  ');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Gracias, hemos recibido tu feedback'),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/feedback',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      message: 'No entiendo que ocurre despues de simular el pago de un dorsal.',
      contactEmail: 'runner@example.com',
      pageUrl: window.location.href,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows quota message when the api returns 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'quota_exceeded' }), { status: 429 }),
    );
    const user = userEvent.setup();

    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      'No entiendo que ocurre despues de confirmar el cambio de titularidad.',
    );
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Ahora mismo no podemos recibir mas feedback. Intentalo mas tarde.',
      ),
    );
  });

  it('shows a generic error message when the api returns a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }),
    );
    const user = userEvent.setup();

    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      'No entiendo que ocurre despues de confirmar el cambio de titularidad.',
    );
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'No se pudo enviar el feedback. Intentalo de nuevo.',
      ),
    );
  });

  it('shows a generic error message when the feedback request rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'));
    const user = userEvent.setup();

    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      'No entiendo que ocurre despues de confirmar el cambio de titularidad.',
    );
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'No se pudo enviar el feedback. Intentalo de nuevo.',
      ),
    );
  });
});
