import { LoginInput, PatchUserProfileInput, RegisterInput, UserProfile } from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { bearerIdentity, currentUserId } from './identity';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

function displayName(user: UserProfile) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
}

function profileComplete(user: UserProfile) {
  return Boolean(user.first_name && user.last_name && user.dni && user.gender && user.age);
}

function runnerDataComplete(user: UserProfile) {
  return Boolean(user.estimated_time && user.t_shirt_size && user.emergency_contact);
}

function ensureUser(request: Request) {
  const userId = currentUserId(request);
  if (!userId) return null;
  const user = mockStore.users.get(userId);
  if (user) return user;

  const identity = bearerIdentity(request);
  if (!identity?.email) return null;
  const [firstName, ...rest] = (identity.name ?? identity.email).trim().split(/\s+/);
  const created = UserProfile.parse({
    id: userId,
    email: identity.email,
    first_name: firstName ?? null,
    last_name: rest.join(' ') || null,
    dni: null,
    gender: null,
    age: null,
    phone_number: null,
    whatsapp_number: null,
    postal_code: null,
    address: null,
    estimated_time: null,
    t_shirt_size: null,
    club: null,
    federation_license: null,
    medical_info: null,
    emergency_contact: null,
    additional_info: null,
    profile_complete: false,
    runner_data_complete: false,
  });
  mockStore.users.set(userId, created);
  return created;
}

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
      name: displayName(user),
      image: null,
    });
  }),

  http.post(`${BASE}/api/v1/auth/register`, async ({ request }) => {
    const body = RegisterInput.parse(await request.json());
    if ([...mockStore.users.values()].some((u) => u.email === body.email)) {
      return HttpResponse.json({ detail: 'email exists' }, { status: 409 });
    }
    const id = crypto.randomUUID();
    const [firstName, ...rest] = body.full_name.trim().split(/\s+/);
    const user = UserProfile.parse({
      id,
      email: body.email,
      first_name: firstName ?? null,
      last_name: rest.join(' ') || null,
      dni: body.dni,
      gender: body.gender,
      age: 18,
      phone_number: null,
      whatsapp_number: null,
      postal_code: null,
      address: null,
      estimated_time: null,
      t_shirt_size: null,
      club: null,
      federation_license: null,
      medical_info: null,
      emergency_contact: null,
      additional_info: null,
      profile_complete: true,
      runner_data_complete: false,
    });
    mockStore.users.set(id, user);
    mockStore.passwords.set(body.email, body.password);
    return HttpResponse.json(
      { id, email: user.email, name: displayName(user), image: null },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/api/v1/me`, ({ request }) => {
    const user = ensureUser(request);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(user);
  }),

  http.patch(`${BASE}/api/v1/me`, async ({ request }) => {
    const userId = currentUserId(request);
    if (!userId) return HttpResponse.json({ detail: 'missing X-User-Id' }, { status: 401 });
    const user = ensureUser(request);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    const patch = PatchUserProfileInput.parse(await request.json());
    const candidate = UserProfile.parse({ ...user, ...patch });
    const updated = UserProfile.parse({
      ...candidate,
      profile_complete: profileComplete(candidate),
      runner_data_complete: runnerDataComplete(candidate),
    });
    mockStore.users.set(userId, updated);
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/api/v1/users/:id/public`, ({ params }) => {
    const user = mockStore.users.get(params.id as string);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({
      id: user.id,
      full_name: displayName(user),
      avg_rating_seller: null,
      avg_rating_buyer: null,
      total_sales: 0,
      total_purchases: 0,
      profile_complete: user.profile_complete,
    });
  }),
];
