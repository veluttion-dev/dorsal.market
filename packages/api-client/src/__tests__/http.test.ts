import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../errors';
import { createHttp } from '../http';

const fetchMock = vi.fn();
beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
});

describe('createHttp', () => {
  const http = createHttp({ baseUrl: 'http://api.test', getUserId: () => 'user-1' });

  it('attaches X-User-Id header when getUserId returns a value', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"items":[]}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await http.get('/api/v1/dorsals');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBe('user-1');
  });

  it('omits X-User-Id when getUserId returns null', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const anon = createHttp({ baseUrl: 'http://api.test', getUserId: () => null });
    await anon.get('/api/v1/dorsals');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBeNull();
  });

  it('throws NotFoundError on 404', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"detail":"not found"}', {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(http.get('/missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError on 422 with detail', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        '{"detail":[{"loc":["body","email"],"msg":"invalid","type":"value_error"}]}',
        { status: 422 },
      ),
    );
    await expect(http.post('/x', { body: {} })).rejects.toBeInstanceOf(ValidationError);
  });

  it('serializes URLSearchParams for repeated query params', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await http.get('/api/v1/dorsals', { query: { distance: ['10k', '42k'], price_max: 50 } });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('distance=10k');
    expect(url).toContain('distance=42k');
    expect(url).toContain('price_max=50');
  });
});
