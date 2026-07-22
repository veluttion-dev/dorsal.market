import { describe, expect, it, vi } from 'vitest';
import { UploadsHttpAdapter } from '../adapters/uploads-http';
import type { HttpClient } from '../http';

describe('UploadsHttpAdapter', () => {
  it('uploads a dorsal photo through the real catalog endpoint', async () => {
    const http = {
      post: vi.fn(async () => ({ photo_url: 'https://s3.example.com/dorsals/photo.jpg' })),
    } as unknown as HttpClient;
    const file = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await new UploadsHttpAdapter(http).uploadPhoto(file);

    expect(result.photoUrl).toBe('https://s3.example.com/dorsals/photo.jpg');
    expect(http.post).toHaveBeenCalledWith('api/v1/dorsals/photos', {
      body: expect.any(FormData),
    });
    const body = vi.mocked(http.post).mock.calls[0]?.[1]?.body as FormData;
    expect(body.get('file')).toBe(file);
  });
});
