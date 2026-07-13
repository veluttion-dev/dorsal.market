import type {
  BuyerTransactionDetail,
  SellerProblemCategory,
  SellerTransactionDetail,
  TimelineEvent,
  TransactionListItem,
  TransactionStatus,
} from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { currentUserId as currentIdentityUserId } from './identity';
import { type MockTransaction, mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';
const SELLER_ID = '33333333-3333-4333-8333-333333333333';

function currentUserId(request: Request) {
  return currentIdentityUserId(request, mockStore.SEED_USER_ID) ?? mockStore.SEED_USER_ID;
}

function displayName(userId: string) {
  const user = mockStore.users.get(userId);
  if (!user) return 'Usuario Demo';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
}

function contact(userId: string) {
  const user = mockStore.users.get(userId);
  return {
    full_name: displayName(userId),
    phone_number: user?.phone_number ?? null,
    whatsapp_number: user?.whatsapp_number ?? null,
    email: user?.email ?? null,
  };
}

function event(key: string, label: string): TimelineEvent {
  return { key, label, completed_at: new Date().toISOString() };
}

function lifecycle(status: TransactionStatus) {
  if (status === 'PENDING_PAYMENT') return 'PENDING_PAYMENT';
  if (status === 'PAYMENT_RECEIVED') return 'DATA_RELEASED';
  if (status === 'TRANSFER_IN_PROGRESS') return 'TRANSFER_IN_PROGRESS';
  if (status === 'TRANSFER_SUBMITTED') return 'VALIDATION_PENDING';
  if (status === 'IN_DISPUTE') return 'DISPUTED';
  if (status === 'RELEASED_TO_SELLER') return 'COMPLETED';
  if (status === 'REFUNDED_TO_BUYER') return 'REFUNDED';
  if (status === 'CANCELLED') return 'CANCELLED';
  return status;
}

function toBuyerDetail(tx: MockTransaction): BuyerTransactionDetail {
  return {
    transaction_id: tx.transaction_id,
    status: tx.status,
    lifecycle_state: tx.lifecycle_state,
    seller_contact: {
      seller_id: tx.seller_id,
      ...contact(tx.seller_id),
    },
    order_summary: {
      dorsal_id: tx.dorsal_id,
      race_name: tx.race_name,
      bib_number: tx.bib_number,
      amount_eur: tx.amount_eur,
    },
    buyer_data_checklist: [],
    timeline: tx.timeline,
    seller_deadline_at: tx.seller_deadline_at,
    buyer_deadline_at: tx.buyer_deadline_at,
  };
}

function toSellerDetail(tx: MockTransaction): SellerTransactionDetail {
  const buyer = mockStore.users.get(tx.buyer_id);
  return {
    transaction_id: tx.transaction_id,
    status: tx.status,
    lifecycle_state: tx.lifecycle_state,
    buyer_contact: {
      buyer_id: tx.buyer_id,
      ...contact(tx.buyer_id),
    },
    buyer_profile: buyer
      ? {
          buyer_id: buyer.id,
          full_name: displayName(buyer.id),
          dni: buyer.dni,
          phone_number: buyer.phone_number,
          whatsapp_number: buyer.whatsapp_number ?? null,
          t_shirt_size: tx.t_shirt_size,
          estimated_time: tx.estimated_time,
          medical_info: buyer.medical_info,
          emergency_contact: tx.emergency_contact,
        }
      : null,
    order_summary: {
      dorsal_id: tx.dorsal_id,
      race_name: tx.race_name,
      bib_number: tx.bib_number,
      amount_eur: tx.amount_eur,
    },
    timeline: tx.timeline,
    seller_deadline_at: tx.seller_deadline_at,
    buyer_deadline_at: tx.buyer_deadline_at,
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
    lifecycle_state: lifecycle(status),
    proof_file_url: proofFileUrl ?? tx.proof_file_url,
    timeline: [...tx.timeline, timelineEvent],
  };
  mockStore.transactions.set(id, updated);
  return updated;
}

function toListItem(tx: MockTransaction): TransactionListItem {
  return {
    transaction_id: tx.transaction_id,
    race_name: tx.race_name,
    race_date: tx.race_date,
    distance: tx.distance,
    location: tx.location,
    payment_method: tx.payment_method,
    price: tx.amount_eur,
    technical_status: tx.status,
    ui_status: tx.lifecycle_state,
    ui_status_label: tx.lifecycle_state,
  };
}

function paginated(items: TransactionListItem[], url: URL) {
  const limit = Number(url.searchParams.get('limit') || 20);
  const offset = Number(url.searchParams.get('offset') || 0);
  const status = url.searchParams.get('status') || undefined;
  const filtered = status ? items.filter((item) => item.technical_status === status) : items;
  return {
    items: filtered.slice(offset, offset + limit),
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
    const body = (await request.json()) as {
      dorsal_id: string;
      buyer_id?: string;
      runner_data?: {
        estimated_time?: string;
        t_shirt_size?: string;
        emergency_contact?: string;
      };
    };
    const transactionId = crypto.randomUUID();
    const buyerId = body.buyer_id ?? currentUserId(request);
    const tx: MockTransaction = {
      transaction_id: transactionId,
      dorsal_id: body.dorsal_id,
      buyer_id: buyerId,
      seller_id: SELLER_ID,
      status: 'PAYMENT_RECEIVED',
      lifecycle_state: 'DATA_RELEASED',
      amount_eur: 45,
      race_name: 'San Silvestre Madrid',
      race_date: '2026-12-31',
      distance: '10k',
      location: 'Madrid',
      bib_number: null,
      payment_method: 'stripe',
      proof_file_url: null,
      estimated_time: body.runner_data?.estimated_time ?? null,
      t_shirt_size: body.runner_data?.t_shirt_size ?? null,
      emergency_contact: body.runner_data?.emergency_contact ?? null,
      timeline: [
        event('payment_held', 'Payment held'),
        event('data_released', 'Buyer data released'),
      ],
      seller_deadline_at: null,
      buyer_deadline_at: null,
      created_at: new Date().toISOString(),
    };
    mockStore.transactions.set(transactionId, tx);
    return HttpResponse.json(
      {
        transaction_id: transactionId,
        payment_client_secret: `pi_mock_${transactionId}_secret_mock`,
        reservation_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/api/v1/transactions/:id/expire-reservation`, ({ params }) => {
    const tx = mockStore.transactions.get(params.id as string);
    if (tx?.status === 'PENDING_PAYMENT') {
      mockStore.transactions.set(params.id as string, {
        ...tx,
        status: 'CANCELLED',
        lifecycle_state: 'CANCELLED',
        timeline: [...tx.timeline, event('reservation_expired', 'Reservation expired')],
      });
    }
    return HttpResponse.json({ processed: true });
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

  http.post(`${BASE}/api/v1/transactions/:id/proof-upload-url`, async ({ params }) => {
    const id = params.id as string;
    return HttpResponse.json({
      upload_url: `${BASE}/mock-uploads/${id}`,
      file_url: `https://example.com/proofs/${id}.pdf`,
    });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/transfer-in-progress`, ({ params }) => {
    const updated = updateTransaction(
      params.id as string,
      'TRANSFER_IN_PROGRESS',
      event('transfer_in_progress', 'Transfer in progress'),
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ processed: true });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/upload-proof`, ({ params }) => {
    const proofFileUrl = `https://example.com/proofs/${params.id}.pdf`;
    const updated = updateTransaction(
      params.id as string,
      'TRANSFER_SUBMITTED',
      event('validation_pending', 'Seller proof submitted'),
      proofFileUrl,
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ processed: true });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/proof`, async ({ params, request }) => {
    const body = (await request.json()) as { proof_file_url: string };
    const updated = updateTransaction(
      params.id as string,
      'TRANSFER_SUBMITTED',
      event('validation_pending', 'Seller proof submitted'),
      body.proof_file_url,
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ processed: true });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/confirm`, ({ params }) => {
    const updated = updateTransaction(
      params.id as string,
      'RELEASED_TO_SELLER',
      event('completed', 'Funds released to seller'),
    );
    if (!updated) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ processed: true });
  }),

  http.post(`${BASE}/api/v1/transactions/:id/dispute`, async ({ params, request }) => {
    const body = (await request.json()) as { buyer_id: string; reason: string };
    const updated = updateTransaction(
      params.id as string,
      'IN_DISPUTE',
      event('disputed', 'Dispute opened'),
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
      .map((tx) => toListItem(tx));
    return HttpResponse.json(paginated(items, url));
  }),

  http.get(`${BASE}/api/v1/me/sales`, ({ request }) => {
    const userId = currentUserId(request);
    const url = new URL(request.url);
    const items = [...mockStore.transactions.values()]
      .filter((tx) => tx.seller_id === userId || userId === mockStore.SEED_USER_ID)
      .map((tx) => toListItem(tx));
    return HttpResponse.json(paginated(items, url));
  }),
];
