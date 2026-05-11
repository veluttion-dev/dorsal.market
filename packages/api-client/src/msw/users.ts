import { LoginInput, RegisterInput, User } from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

export const usersHandlers = [
  http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = LoginInput.parse(await request.json());
    const stored = mockStore.passwords.get(body.email);
    if (!stored || stored !== body.password) {
      return HttpResponse.json({ detail: 'invalid credentials' }, { status: 401 });
    }
    const user = [...mockStore.users.values()].find((u) => u.email === body.email);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({
      id: user.id,
      email: user.email,
      name: user.full_name,
      image: user.avatar_url,
    });
  }),

  http.post(`${BASE}/api/v1/auth/register`, async ({ request }) => {
    const body = RegisterInput.parse(await request.json());
    if ([...mockStore.users.values()].some((u) => u.email === body.email)) {
      return HttpResponse.json({ detail: 'email exists' }, { status: 409 });
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const user = User.parse({
      id,
      email: body.email,
      full_name: body.full_name,
      dni: body.dni,
      gender: body.gender,
      birth_date: body.birth_date,
      avatar_url: null,
      rating_average: null,
      total_sales: 0,
      total_purchases: 0,
      created_at: now,
      updated_at: now,
    });
    mockStore.users.set(id, user);
    mockStore.passwords.set(body.email, body.password);
    return HttpResponse.json(
      { id, email: user.email, name: user.full_name, image: null },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/api/v1/users/me`, ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'missing X-User-Id' }, { status: 401 });
    const user = mockStore.users.get(userId);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(user);
  }),

  http.patch(`${BASE}/api/v1/users/me`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'missing X-User-Id' }, { status: 401 });
    const user = mockStore.users.get(userId);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    const patch = (await request.json()) as Partial<User>;
    const updated: User = {
      ...user,
      ...patch,
      contact: { ...(user.contact ?? {}), ...(patch.contact ?? {}) },
      runner: { ...(user.runner ?? {}), ...(patch.runner ?? {}) },
      updated_at: new Date().toISOString(),
    };
    mockStore.users.set(userId, updated);
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/api/v1/users/:id`, ({ params }) => {
    const u = mockStore.users.get(params.id as string);
    if (!u) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({
      id: u.id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      rating_average: u.rating_average,
      total_sales: u.total_sales,
    });
  }),
];
