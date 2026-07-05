import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoUpload } from '../photo-upload.client';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock('@/features/dorsals/hooks/use-presign-photo', () => ({
  usePresignPhoto: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: false,
  }),
}));

describe('PhotoUpload', () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
  });

  it('lets users replace an already selected image', async () => {
    mocks.mutate.mockImplementation((_file, options) => {
      options.onSuccess({
        finalUrl: 'https://example.com/replacement.jpg',
        previewUrl: 'blob:replacement-preview',
      });
    });
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<PhotoUpload value="https://example.com/current.jpg" onChange={onChange} />);

    const changeInput = screen.getByLabelText('Cambiar foto', { selector: 'input' });
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument();
    expect(changeInput.closest('label')).toBeNull();

    const file = new File(['replacement'], 'replacement.jpg', { type: 'image/jpeg' });
    await user.upload(changeInput, file);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://example.com/replacement.jpg'),
    );
    expect(screen.getByAltText('Vista previa del dorsal')).toHaveAttribute(
      'src',
      'blob:replacement-preview',
    );
  });
});
