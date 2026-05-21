import type {
  BuyerTransactionDetail,
  SellerProblemCategory,
  SellerTransactionDetail,
  TimelineEvent,
  TransactionListItem,
  TransactionStatus,
} from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { type MockTransaction, mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';
const SELLER_ID = '33333333-3333-4333-8333-333333333333';

function currentUserId(request: Request) {
  const bearer = request.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) return mockStore.SEED_USER_ID;
  return request.headers.get('x-user-id') ?? mockStore.SEED_USER_ID;
}

function event(type: TimelineEvent['type'], actor: TimelineEvent['actor'] = 'system') {
  return { type, at: new Date().toISOString(), actor };
}

function toBuyerDetail(tx: MockTransaction): BuyerTransactionDetail {
  return {
    id: tx.id,
    dorsal_id: tx.dorsal_id,
    buyer_id: tx.buyer_id,
    seller_id: tx.seller_id,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    stripe_payment_intent_client_secret: tx.stripe_payment_intent_client_secret,
    proof_file_url: tx.proof_file_url,
    timeline: tx.timeline,
    dorsal_snapshot: tx.dorsal_snapshot,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
  };
}

function toSellerDetail(tx: MockTransaction): SellerTransactionDetail {
  return {
    id: tx.id,
    dorsal_id: tx.dorsal_id,
    buyer_id: tx.buyer_id,
    seller_id: tx.seller_id,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    proof_file_url: tx.proof_file_url,
    timeline: tx.timeline,
    buyer_snapshot: tx.buyer_snapshot,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
  };
}

function updateTransaction(
  id: string,
  status: TransactionStatus,
  timelineEvent: TimelineEvent,
  proofFileUrl?: string,
) {
  const tx = mockStore.transactions.get(id);
  if (!tx) return null;
  const updated: MockTransaction = {
    ...tx,
    status,
    proof_file_url: proofFileUrl ?? tx.proof_file_url,
    timeline: [...tx.timeline, timelineEvent],
    updated_at: new Date().toISOString(),
  };
  mockStore.transactions.set(id, updated);
  return updated;
}

function toListItem(tx: MockTransaction, role: 'buyer' | 'seller'): TransactionListItem {
  return {
    id: tx.id,
    dorsal_id: tx.dorsal_id,
    status: tx.status,
    amount: tx.amount,
    counterparty_name: role === 'buyer' ? 'Vendedor Demo' : tx.buyer_snapshot.full_name,
    race_name: tx.dorsal_snapshot.race_name,
    created_at: tx.created_at,
  };
}

function paginated(items: TransactionListItem[], url: URL) {
  const limit = Number(url.searchParams.get('limit') || 20);
  const offset = Number(url.searchParams.get('offset') || 0);
  const status = url.searchParams.get('status') || undefined;
  const filtered = status ? items.filter((item) => item.status === status) : items;
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  };
}

export const transactionsHandlers = [
  http.post(`${BASE}/api/v1/sellers/onboard`, () =>
    HttpResponse.json({
      account_id: 'acct_mock',
      onboarding_url: null,
      charges_enabled: true,
    }),
  ),

  http.post(`${BASE}/api/v1/transactions`, async ({ request }) => {
    const body = (await request.json()) as { dorsal_id: string; buyer_id?: string };
    const transactionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const buyerId = body.buyer_id ?? currentUserId(request);
    const tx: MockTransaction = {
      id: transactionId,
      dorsal_id: body.dorsal_id,
      buyer_id: buyerId,
      seller_id: SELLER_ID,
      status: 'reserved',
      amount: 45,
      currency: 'EUR',
      stripe_payment_intent_client_secret: `pi_mock_${transactionId}_secret_mock`,
      proof_file_url: null,
      timeline: [{ type: 'reservation_created', at: now, actor: 'buyer' }],
      dorsal_snapshot: {
        race_name: 'San Silvestre Madrid',
        race_date: '2026-12-31',
        location: 'Madrid',
        distance: '10k',
        photo_url: 'https://example.com/dorsal.jpg',
      },
      buyer_snapshot: {
        full_name: 'Carlos Martinez',
        dni: '12345678X',
        email: 'demo@dorsal.market',
        phone: '612345678',
        birth_date: '1990-06-15',
        runner: {
          shirt_size: 'L',
          club: 'Runners Madrid',
        },
      },
      created_at: now,
      updated_at: now,
    };
    mockStore.transactions.set(transactionId, tx);
    return HttpResponse.json(
      {
        transaction_id: transactionId,
        stripe_payment_intent_client_secret: tx.stripe_payment_intent_client_secret,
        amount: tx.amount,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/api/v1/transactions/buyer/:id`, ({ params }) => {
    const tx = mockStore.transactions.get(params.id as string);
    if (!tx) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(toBuyerDetail(tx));
  }),

  http.get(`${BASE}/api/v1/transactions/seller/:id`, ({ params }) => {
    const tx = mockStore.transactions.get(params.id as string);
    if (!tx) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(toSellerDetail(tx));
  }),

  http.post(`${BASE}/api/v1/transactions/:id/proof-upload-url`, async ({ params, request }) => {
    const body = (await request.json()) as { content_type: string };
    const id = params.id as string;
    const extension = body.content_type === 'application/pdf' ? 'pdf' : 'jpg';
    return HttpResponse.json({
      upload_url: `${BASE}/mock-uploads/${id}.${extension}`,
      upload_method: 'PUT',
      final_url: `https://example.com/proofs/${id}.${extension}`,
    });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/transfer-in-progress`, ({ params }) => {
    const updated = updateTransaction(
      params.id as string,
      'transfer_in_progress',
      event('transfer_in_progress', 'seller'),
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(toSellerDetail(updated));
  }),

  http.post(`${BASE}/api/v1/transactions/:id/upload-proof`, ({ params }) => {
    const proofFileUrl = `https://example.com/proofs/${params.id}.pdf`;
    return HttpResponse.json({ proof_file_url: proofFileUrl }, { status: 201 });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/proof`, async ({ params, request }) => {
    const body = (await request.json()) as { proof_file_url: string };
    const updated = updateTransaction(
      params.id as string,
      'transfer_proof_submitted',
      event('proof_submitted', 'seller'),
      body.proof_file_url,
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(toSellerDetail(updated));
  }),

  http.post(`${BASE}/api/v1/transactions/:id/confirm`, ({ params }) => {
    const updated = updateTransaction(
      params.id as string,
      'confirmed',
      event('transfer_confirmed', 'buyer'),
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(toBuyerDetail(updated));
  }),

  http.post(`${BASE}/api/v1/transactions/:id/dispute`, async ({ params, request }) => {
    const body = (await request.json()) as { buyer_id: string; reason: string };
    const updated = updateTransaction(
      params.id as string,
      'disputed',
      event('dispute_opened', 'buyer'),
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        transaction_id: params.id as string,
        opened_by: body.buyer_id,
        reason: body.reason,
        status: 'open',
        resolution_notes: null,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post(
    `${BASE}/api/v1/transactions/:id/seller-problem-reports`,
    async ({ params, request }) => {
      const fd = await request.formData();
      return HttpResponse.json(
        {
          id: crypto.randomUUID(),
          transaction_id: params.id as string,
          seller_id: SELLER_ID,
          category: fd.get('category') as SellerProblemCategory,
          message: String(fd.get('message') ?? ''),
          attachments: [],
          status: 'open',
          resolution_notes: null,
          created_at: new Date().toISOString(),
        },
        { status: 201 },
      );
    },
  ),

  http.get(`${BASE}/api/v1/me/purchases`, ({ request }) => {
    const userId = currentUserId(request);
    const url = new URL(request.url);
    const items = [...mockStore.transactions.values()]
      .filter((tx) => tx.buyer_id === userId)
      .map((tx) => toListItem(tx, 'buyer'));
    return HttpResponse.json(paginated(items, url));
  }),

  http.get(`${BASE}/api/v1/me/sales`, ({ request }) => {
    const userId = currentUserId(request);
    const url = new URL(request.url);
    const items = [...mockStore.transactions.values()]
      .filter((tx) => tx.seller_id === userId || userId === mockStore.SEED_USER_ID)
      .map((tx) => toListItem(tx, 'seller'));
    return HttpResponse.json(paginated(items, url));
  }),
];
