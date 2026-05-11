import { fromHttpStatus, NetworkError } from './errors';

export type GetUserId = () => string | null | undefined;

export interface HttpRequest {
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface HttpClient {
  get<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  post<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  put<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  patch<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  delete<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
}

export interface HttpClientOptions {
  baseUrl: string;
  getUserId: GetUserId;
}

function buildUrl(base: string, path: string, query?: HttpRequest['query']): string {
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, String(item)));
      else url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

export function createHttp(opts: HttpClientOptions): HttpClient {
  async function request<T>(method: string, path: string, init?: HttpRequest): Promise<T> {
    const headers = new Headers(init?.headers);
    if (init?.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const userId = opts.getUserId();
    if (userId) headers.set('X-User-Id', userId);

    const fetchInit: RequestInit = { method, headers };
    if (init?.body !== undefined) fetchInit.body = JSON.stringify(init.body);
    if (init?.signal) fetchInit.signal = init.signal;

    let response: Response;
    try {
      response = await fetch(buildUrl(opts.baseUrl, path, init?.query), fetchInit);
    } catch (e) {
      throw new NetworkError(e);
    }

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        /* ignore */
      }
      throw fromHttpStatus(response.status, detail);
    }

    if (response.status === 204) return undefined as T;
    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return (await response.json()) as T;
    return (await response.text()) as unknown as T;
  }

  return {
    get: (p, o) => request('GET', p, o),
    post: (p, o) => request('POST', p, o),
    put: (p, o) => request('PUT', p, o),
    patch: (p, o) => request('PATCH', p, o),
    delete: (p, o) => request('DELETE', p, o),
  };
}
