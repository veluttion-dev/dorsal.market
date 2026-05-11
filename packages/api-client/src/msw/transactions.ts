import { PurchaseInput, type TimelineStep, type Transaction } from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

const TIMELINE_TEMPLATE: TimelineStep[] = [
  { step: 'payment_held', completed: false, completed_at: null },
  { step: 'data_sent', completed: false, completed_at: null },
  { step: 'change_in_progress', completed: false, completed_at: null },
  { step: 'change_confirmed', completed: false, completed_at: null },
  { step: 'released', completed: false, completed_at: null },
];

export const transactionsHandlers = [
  http.post(`${BASE}/api/v1/transactions`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const body = PurchaseInput.parse(await request.json());
    const tx_id = crypto.randomUUID();
    const now = new Date().toISOString();
    const firstStep = { ...TIMELINE_TEMPLATE[0]!, completed: true, completed_at: now };
    const tx: Transaction = {
      id: tx_id,
      dorsal_id: body.dorsal_id,
      buyer_id: userId,
      seller_id: '550e8400-e29b-41d4-a716-446655440002',
      amount: 50,
      currency: 'EUR',
      status: 'payment_held',
      stripe_payment_intent_id: `pi_mock_${tx_id.slice(0, 8)}`,
      timeline: [firstStep, ...TIMELINE_TEMPLATE.slice(1)],
      created_at: now,
      updated_at: now,
    };
    mockStore.transactions.set(tx_id, tx);
    return HttpResponse.json(
      { transaction_id: tx_id, client_secret: `mock_secret_${tx_id}` },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/api/v1/transactions/:id/confirm`, ({ params }) => {
    const tx = mockStore.transactions.get(params.id as string);
    if (!tx) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(tx);
  }),

  http.get(`${BASE}/api/v1/transactions/mine`, ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const list = [...mockStore.transactions.values()].filter(
      (t) => t.buyer_id === userId || t.seller_id === userId,
    );
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/api/v1/transactions/:id`, ({ params }) => {
    const t = mockStore.transactions.get(params.id as string);
    if (!t) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(t);
  }),

  http.post(`${BASE}/api/v1/transactions/:id/advance`, async ({ params, request }) => {
    const t = mockStore.transactions.get(params.id as string);
    if (!t) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    const { step } = (await request.json()) as { step: TimelineStep['step'] };
    const now = new Date().toISOString();
    const timeline = t.timeline.map((s) =>
      s.step === step ? { ...s, completed: true, completed_at: now } : s,
    );
    const allDone = timeline.every((s) => s.completed);
    const updated: Transaction = {
      ...t,
      timeline,
      status: allDone ? 'released' : t.status,
      updated_at: now,
    };
    mockStore.transactions.set(t.id, updated);
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/api/v1/transactions/:id/dispute`, async ({ params, request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const body = (await request.json()) as { reason: string; evidence_urls: string[] };
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        transaction_id: params.id as string,
        opened_by: userId,
        reason: body.reason,
        evidence_urls: body.evidence_urls,
        status: 'open',
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/api/v1/transactions/:id/messages`, () => HttpResponse.json([])),

  http.post(`${BASE}/api/v1/transactions/:id/messages`, async ({ params, request }) => {
    const userId = request.headers.get('x-user-id');
    const body = (await request.json()) as { content: string };
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        transaction_id: params.id as string,
        sender_id: userId ?? mockStore.SEED_USER_ID,
        content: body.content,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
