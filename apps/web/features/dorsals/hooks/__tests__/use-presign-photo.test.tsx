import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePresignPhoto } from '../use-presign-photo';

const uploadPhoto = vi.fn();

vi.mock('@/lib/api-client', () => ({
  useApi: () => ({
    uploads: { uploadPhoto },
  }),
}));

describe('usePresignPhoto', () => {
  beforeEach(() => {
    uploadPhoto.mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-url');
  });

  it('stores the backend photo URL while keeping a local preview', async () => {
    uploadPhoto.mockResolvedValueOnce({ photoUrl: 'https://s3.example.com/dorsals/photo.jpg' });
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const file = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => usePresignPhoto(), { wrapper });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(uploadPhoto).toHaveBeenCalledWith(file);
    expect(result.current.data).toEqual({
      finalUrl: 'https://s3.example.com/dorsals/photo.jpg',
      previewUrl: 'blob:preview-url',
    });
  });
});
