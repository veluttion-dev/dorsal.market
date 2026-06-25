import { describe, expect, it, vi } from 'vitest';
import { DorsalsHttpAdapter } from '../adapters/dorsals-http';
import type { HttpClient } from '../http';

describe('DorsalsHttpAdapter', () => {
  it('searches public catalog without auth', async () => {
    const http = {
      get: vi.fn(async () => ({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      })),
    } as unknown as HttpClient;

    await new DorsalsHttpAdapter(http).search({});

    expect(http.get).toHaveBeenCalledWith('api/v1/dorsals', { query: {}, auth: false });
  });
});
