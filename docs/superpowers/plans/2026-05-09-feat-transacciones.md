# feat/transacciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Transaction feature surface (UC-03 escrow + disputas, UC-06 compra, UC-07/08 timeline post-venta + soporte) against the **real backend Transaction module** (vivo desde 2026-05-14). Cubre seller onboarding por Stripe Connect, reserva con PaymentIntent, vistas separadas buyer/seller, flujo de prueba de transferencia, disputas, y los seller problem reports post-resolución.

**Architecture.** Buy flow comienza en `/dorsales/[id]` (CTA "Comprar") → reserva crea PaymentIntent → Stripe Elements confirma pago → backend recibe el webhook → frontend hace polling al endpoint `/transactions/buyer/{id}`. Tracking page es client-rendered con `useQuery` polling cada 10s (`refetchInterval`). Acciones (transfer-in-progress, upload-proof, confirm, dispute) son `useMutation` que invalidan el query del tracking.

**Tech stack adicional sobre foundation:** `@stripe/stripe-js`, `@stripe/react-stripe-js`, `@sentry/nextjs` (DSN vacío en dev → no-op).

**Spec reference:** `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md` ADR-004 (mock layer), ADR-006 (Server Components), ADR-007 (TanStack Query), ADR-011 (presigned uploads), ADR-015 (observabilidad).

**Backend contract reference:** `postman/transaction_bounded_context.postman_collection.json` (en raíz del repo).

**Pre-flight branching:**
```bash
git switch feat/foundation       # parte directamente de foundation, NO de otras feature branches
git pull
git switch -c feat/transacciones
```

**Parallel work note (ADR-012).** Esta rama es **independiente** de `feat/dorsales` y `feat/usuarios`. Su slice de archivos no toca lo que ellas tocan. Si necesitas conocer el `dorsal_id` para reservar, usa los mocks de Catalog hasta que el backend real esté arriba; si necesitas auth, el HTTP client de foundation ya inyecta `Authorization: Bearer <jwt>` automáticamente cuando hay sesión Auth.js.

---

## File Structure (additions)

```
apps/web/
├── app/(app)/compra/
│   ├── [transactionId]/page.tsx        # UC-07/08 tracking (rol-aware)
│   ├── confirmada/page.tsx             # post-pago redirect target
│   └── checkout/[dorsalId]/page.tsx    # Stripe Elements wrapper
├── app/(app)/vender/
│   └── onboarding/page.tsx             # UC-03 Stripe Connect onboarding del seller
├── components/transaction/
│   ├── tracking-timeline.client.tsx    # timeline de eventos
│   ├── tracking-step.tsx
│   ├── transfer-actions.client.tsx     # acciones del seller (transfer-in-progress, upload-proof)
│   ├── confirm-action.client.tsx       # acción del buyer (confirm) + dispute
│   ├── dispute-dialog.client.tsx
│   ├── seller-problem-report.client.tsx
│   └── proof-uploader.client.tsx
└── features/transactions/
    ├── hooks/
    │   ├── use-onboard-seller.ts
    │   ├── use-reserve-listing.ts
    │   ├── use-buyer-transaction.ts
    │   ├── use-seller-transaction.ts
    │   ├── use-transfer-in-progress.ts
    │   ├── use-submit-proof.ts
    │   ├── use-confirm-transfer.ts
    │   ├── use-open-dispute.ts
    │   ├── use-seller-problem-report.ts
    │   ├── use-my-purchases.ts
    │   └── use-my-sales.ts
    ├── components/
    │   └── checkout-form.client.tsx
    └── lib/
        └── stripe.ts                   # loadStripe singleton

packages/api-client/src/
├── ports/transactions.ts               # ACTUALIZAR — nuevos métodos
├── adapters/transactions-http.ts       # ACTUALIZAR — paths reales del backend
└── msw/transactions.ts                 # ACTUALIZAR — shape real

packages/schemas/src/
└── transaction.ts                      # ACTUALIZAR — añadir SellerProblemReport, refinar TransactionStatus/Timeline
```

---

## Task 1: Branch setup + Stripe + Sentry deps

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add deps**

```bash
cd apps/web
pnpm add @stripe/stripe-js@4.10.0 @stripe/react-stripe-js@2.9.0 @sentry/nextjs@8.40.0
```

- [ ] **Step 2: Initialize Sentry (no-op si DSN vacío)**

```bash
pnpm dlx @sentry/wizard@latest -i nextjs --skip-connect
```

Acepta defaults; el wizard crea `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. En cada uno sustituye la cadena del DSN por `process.env.SENTRY_DSN ?? ''` (server/edge) y `process.env.NEXT_PUBLIC_SENTRY_DSN ?? ''` (client). Con DSN vacío Sentry no envía nada.

- [ ] **Step 3: Stripe singleton**

`apps/web/features/transactions/lib/stripe.ts`:

```ts
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let promise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!promise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    promise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return promise;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(transacciones): add Stripe Elements and Sentry SDKs"
```

---

## Task 2: Update transaction schemas to match real backend

**Why:** El plan original asumía un endpoint `advanceStep`; el backend real tiene endpoints granulares por evento. También añadimos seller problem reports.

**Files:**
- Modify: `packages/schemas/src/transaction.ts`

- [ ] **Step 1: Reescribir transaction.ts**

```ts
import { z } from 'zod';
import { IsoDateTime, Uuid } from './common';

// Status técnico del modelo del backend (no es un timeline, es un estado)
export const TransactionStatus = z.enum([
  'reserved',                  // Reserva creada, esperando pago
  'paid',                      // PaymentIntent confirmed, fondos retenidos
  'transfer_in_progress',      // Seller marcó cambio en proceso
  'transfer_proof_submitted',  // Seller subió prueba
  'confirmed',                 // Buyer confirmó cambio recibido
  'released_to_seller',        // Fondos transferidos al seller
  'refunded_to_buyer',         // Reembolso al buyer
  'disputed',                  // Buyer abrió disputa
  'expired',                   // Reserva expiró sin pago
  'cancelled',
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

// Timeline derivado de los eventos para la UI
export const TimelineEventType = z.enum([
  'reservation_created',
  'payment_succeeded',
  'transfer_in_progress',
  'proof_submitted',
  'transfer_confirmed',
  'funds_released',
  'dispute_opened',
  'dispute_resolved',
  'refunded',
]);
export type TimelineEventType = z.infer<typeof TimelineEventType>;

export const TimelineEvent = z.object({
  type: TimelineEventType,
  at: IsoDateTime,
  actor: z.enum(['buyer', 'seller', 'system', 'admin']).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

// Vista para el buyer
export const BuyerTransactionDetail = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  currency: z.literal('EUR'),
  stripe_payment_intent_client_secret: z.string().nullable(),
  proof_file_url: z.string().url().nullable(),
  timeline: z.array(TimelineEvent),
  // Datos del dorsal embebidos para no pedirlos aparte
  dorsal_snapshot: z.object({
    race_name: z.string(),
    race_date: z.string().nullable(),
    location: z.string(),
    distance: z.string(),
    photo_url: z.string().url(),
  }),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type BuyerTransactionDetail = z.infer<typeof BuyerTransactionDetail>;

// Vista para el seller — incluye datos del buyer para hacer el cambio de titularidad
export const SellerTransactionDetail = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  currency: z.literal('EUR'),
  proof_file_url: z.string().url().nullable(),
  timeline: z.array(TimelineEvent),
  // Datos del comprador que el seller necesita para hacer el cambio
  buyer_snapshot: z.object({
    full_name: z.string(),
    dni: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    birth_date: z.string(),
    runner: z.object({
      shirt_size: z.string().nullable(),
      club: z.string().nullable(),
    }).optional(),
  }),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type SellerTransactionDetail = z.infer<typeof SellerTransactionDetail>;

// Resultado de la reserva
export const ReserveListingResponse = z.object({
  transaction_id: Uuid,
  stripe_payment_intent_client_secret: z.string(),
  amount: z.coerce.number().nonnegative(),
  expires_at: IsoDateTime,
});
export type ReserveListingResponse = z.infer<typeof ReserveListingResponse>;

// Onboarding del seller (Stripe Connect)
export const SellerOnboardingResponse = z.object({
  account_id: z.string(),
  onboarding_url: z.string().url().nullable(),
  charges_enabled: z.boolean(),
});
export type SellerOnboardingResponse = z.infer<typeof SellerOnboardingResponse>;

// Presigned URL para subir la prueba de transferencia
export const ProofUploadUrlResponse = z.object({
  upload_url: z.string().url(),
  upload_method: z.enum(['PUT', 'POST']),
  fields: z.record(z.string()).optional(),
  final_url: z.string().url(),
});
export type ProofUploadUrlResponse = z.infer<typeof ProofUploadUrlResponse>;

// Disputas
export const Dispute = z.object({
  id: Uuid,
  transaction_id: Uuid,
  opened_by: Uuid,
  reason: z.string(),
  status: z.enum(['open', 'in_review', 'resolved_buyer', 'resolved_seller']),
  resolution_notes: z.string().nullable(),
  created_at: IsoDateTime,
});
export type Dispute = z.infer<typeof Dispute>;

// Seller problem reports (post-final, distinto de disputa)
export const SellerProblemCategory = z.enum([
  'buyer_data_issue',
  'race_rejected_transfer',
  'payment_or_payout_issue',
  'other',
]);
export type SellerProblemCategory = z.infer<typeof SellerProblemCategory>;

export const SellerProblemReport = z.object({
  id: Uuid,
  transaction_id: Uuid,
  seller_id: Uuid,
  category: SellerProblemCategory,
  message: z.string(),
  attachments: z.array(z.string().url()).default([]),
  status: z.enum(['open', 'in_review', 'resolved']),
  resolution_notes: z.string().nullable(),
  created_at: IsoDateTime,
});
export type SellerProblemReport = z.infer<typeof SellerProblemReport>;

// Listados de historial (UC-10)
export const TransactionListItem = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  status: TransactionStatus,
  amount: z.coerce.number().nonnegative(),
  counterparty_name: z.string(),
  race_name: z.string(),
  created_at: IsoDateTime,
});
export type TransactionListItem = z.infer<typeof TransactionListItem>;

export const TransactionListResponse = z.object({
  items: z.array(TransactionListItem),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponse>;
```

- [ ] **Step 2: Tests del schema**

`packages/schemas/src/__tests__/transaction.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  BuyerTransactionDetail,
  ReserveListingResponse,
  SellerProblemReport,
  TransactionStatus,
} from '../transaction';

describe('TransactionStatus', () => {
  it('accepts released_to_seller and refunded_to_buyer (per Postman)', () => {
    expect(TransactionStatus.parse('released_to_seller')).toBe('released_to_seller');
    expect(TransactionStatus.parse('refunded_to_buyer')).toBe('refunded_to_buyer');
  });
});

describe('ReserveListingResponse', () => {
  it('parses a typical backend reservation response', () => {
    const out = ReserveListingResponse.parse({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      stripe_payment_intent_client_secret: 'pi_secret_x',
      amount: '45.00',
      expires_at: '2026-05-14T12:00:00Z',
    });
    expect(out.amount).toBe(45);
  });
});

describe('BuyerTransactionDetail', () => {
  it('includes dorsal_snapshot', () => {
    const sample = {
      id: '11111111-1111-4111-8111-111111111111',
      dorsal_id: '55555555-5555-4555-8555-555555555555',
      buyer_id: '22222222-2222-4222-8222-222222222222',
      seller_id: '33333333-3333-4333-8333-333333333333',
      status: 'paid' as const,
      amount: 45,
      currency: 'EUR' as const,
      stripe_payment_intent_client_secret: null,
      proof_file_url: null,
      timeline: [],
      dorsal_snapshot: {
        race_name: 'Madrid',
        race_date: '2026-12-31',
        location: 'Madrid',
        distance: '10k',
        photo_url: 'https://x/y.jpg',
      },
      created_at: '2026-05-14T10:00:00Z',
      updated_at: '2026-05-14T10:00:00Z',
    };
    expect(BuyerTransactionDetail.parse(sample).dorsal_snapshot.race_name).toBe('Madrid');
  });
});

describe('SellerProblemReport', () => {
  it('accepts race_rejected_transfer category', () => {
    const parsed = SellerProblemReport.parse({
      id: '88888888-8888-4888-8888-888888888888',
      transaction_id: '11111111-1111-4111-8111-111111111111',
      seller_id: '33333333-3333-4333-8333-333333333333',
      category: 'race_rejected_transfer',
      message: 'organizer rejected',
      attachments: [],
      status: 'open',
      resolution_notes: null,
      created_at: '2026-05-14T10:00:00Z',
    });
    expect(parsed.category).toBe('race_rejected_transfer');
  });
});
```

- [ ] **Step 3: Run schema tests**

```bash
pnpm --filter @dorsal/schemas test
```

Expected: ≥ 4 tests passing on the new file.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(schemas): update Transaction schemas to match real backend contract"
```

---

## Task 3: Update HTTP adapter, port and mock

**Files:**
- Modify: `packages/api-client/src/ports/transactions.ts`
- Modify: `packages/api-client/src/adapters/transactions-http.ts`
- Modify: `packages/api-client/src/msw/transactions.ts`
- Modify: `packages/api-client/src/http.ts` (añadir `getAuthToken`)

- [ ] **Step 1: Ampliar HTTP client para soportar Bearer JWT además de X-User-Id**

En `packages/api-client/src/http.ts`, añadir a `HttpClientOptions`:

```ts
export interface HttpClientOptions {
  baseUrl: string;
  getUserId?: () => string | null | undefined;
  getAuthToken?: () => string | null | undefined;
}
```

Y dentro de `request()`, además de `X-User-Id`, set `Authorization: Bearer <token>` si `getAuthToken` devuelve algo. Ambos pueden coexistir mientras dure la migración del backend.

Actualiza `apps/web/lib/api.ts` y `apps/web/lib/api-client.ts` para pasar `getAuthToken` desde la sesión Auth.js (el JWT firmado vive en `session.user.token`, hay que añadirlo en `auth.config.ts` callbacks). Esta parte se coordina con `feat/usuarios` si esa rama también está tocando el callback.

- [ ] **Step 2: New port interface**

`packages/api-client/src/ports/transactions.ts`:

```ts
import type {
  BuyerTransactionDetail,
  Dispute,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  SellerOnboardingResponse,
  SellerProblemCategory,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
} from '@dorsal/schemas';

export interface TransactionsPort {
  // Onboarding del seller (Stripe Connect)
  onboardSeller(sellerId: string): Promise<SellerOnboardingResponse>;

  // UC-06 Reserva
  reserveListing(input: { dorsalId: string; buyerId: string }): Promise<ReserveListingResponse>;

  // Tracking — vistas separadas buyer/seller
  getBuyerTransaction(id: string): Promise<BuyerTransactionDetail>;
  getSellerTransaction(id: string): Promise<SellerTransactionDetail>;

  // Upload de prueba — dos rutas
  getProofUploadUrl(id: string, input: { sellerId: string; contentType: string }): Promise<ProofUploadUrlResponse>;
  uploadProofMultipart(id: string, file: File): Promise<{ proof_file_url: string }>;
  submitProofUrl(id: string, input: { proofFileUrl: string; sellerId: string }): Promise<SellerTransactionDetail>;

  // Acciones del seller
  markTransferInProgress(id: string, sellerId: string): Promise<SellerTransactionDetail>;

  // Acciones del buyer
  confirmTransfer(id: string, buyerId: string): Promise<BuyerTransactionDetail>;
  openDispute(id: string, input: { buyerId: string; reason: string }): Promise<Dispute>;

  // Seller problem reports (post-final)
  createSellerProblemReport(input: {
    transactionId: string;
    category: SellerProblemCategory;
    message: string;
    files?: File[];
  }): Promise<SellerProblemReport>;

  // History (UC-10)
  listMyPurchases(query?: { status?: string; limit?: number; offset?: number }): Promise<TransactionListResponse>;
  listMySales(query?: { status?: string; limit?: number; offset?: number }): Promise<TransactionListResponse>;
}
```

- [ ] **Step 3: Rewrite HTTP adapter**

`packages/api-client/src/adapters/transactions-http.ts`:

```ts
import {
  BuyerTransactionDetail,
  Dispute,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  SellerOnboardingResponse,
  type SellerProblemCategory,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
} from '@dorsal/schemas';
import { z } from 'zod';
import type { HttpClient } from '../http';
import type { TransactionsPort } from '../ports';

export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient, private baseUrl: string) {}

  async onboardSeller(sellerId: string) {
    return SellerOnboardingResponse.parse(
      await this.http.post('api/v1/sellers/onboard', { body: { user_id: sellerId } }),
    );
  }

  async reserveListing(input: { dorsalId: string; buyerId: string }) {
    return ReserveListingResponse.parse(
      await this.http.post('api/v1/transactions', {
        body: { dorsal_id: input.dorsalId, buyer_id: input.buyerId },
      }),
    );
  }

  async getBuyerTransaction(id: string) {
    return BuyerTransactionDetail.parse(await this.http.get(`api/v1/transactions/buyer/${id}`));
  }

  async getSellerTransaction(id: string) {
    return SellerTransactionDetail.parse(await this.http.get(`api/v1/transactions/seller/${id}`));
  }

  async getProofUploadUrl(id: string, input: { sellerId: string; contentType: string }) {
    return ProofUploadUrlResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/proof-upload-url`, {
        body: { seller_id: input.sellerId, content_type: input.contentType },
      }),
    );
  }

  async uploadProofMultipart(id: string, file: File) {
    // Multipart bypasses el http client JSON serializer y va directo vía fetch.
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${this.baseUrl}/api/v1/transactions/${id}/upload-proof`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) throw new Error(`upload-proof failed: ${res.status}`);
    return z.object({ proof_file_url: z.string().url() }).parse(await res.json());
  }

  async submitProofUrl(id: string, input: { proofFileUrl: string; sellerId: string }) {
    return SellerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/proof`, {
        body: { proof_file_url: input.proofFileUrl, seller_id: input.sellerId },
      }),
    );
  }

  async markTransferInProgress(id: string, sellerId: string) {
    return SellerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/transfer-in-progress`, {
        body: { seller_id: sellerId },
      }),
    );
  }

  async confirmTransfer(id: string, buyerId: string) {
    return BuyerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/confirm`, { body: { buyer_id: buyerId } }),
    );
  }

  async openDispute(id: string, input: { buyerId: string; reason: string }) {
    return Dispute.parse(
      await this.http.post(`api/v1/transactions/${id}/dispute`, {
        body: { buyer_id: input.buyerId, reason: input.reason },
      }),
    );
  }

  async createSellerProblemReport(input: {
    transactionId: string;
    category: SellerProblemCategory;
    message: string;
    files?: File[];
  }) {
    const fd = new FormData();
    fd.append('category', input.category);
    fd.append('message', input.message);
    for (const f of input.files ?? []) fd.append('files', f);
    const res = await fetch(
      `${this.baseUrl}/api/v1/transactions/${input.transactionId}/seller-problem-reports`,
      { method: 'POST', body: fd },
    );
    if (!res.ok) throw new Error(`seller-problem-report failed: ${res.status}`);
    return SellerProblemReport.parse(await res.json());
  }

  async listMyPurchases(query?: { status?: string; limit?: number; offset?: number }) {
    return TransactionListResponse.parse(
      await this.http.get('api/v1/me/purchases', { query: query ?? {} }),
    );
  }

  async listMySales(query?: { status?: string; limit?: number; offset?: number }) {
    return TransactionListResponse.parse(
      await this.http.get('api/v1/me/sales', { query: query ?? {} }),
    );
  }
}
```

Actualiza también `packages/api-client/src/factory.ts` para pasar `baseUrl` al constructor de `TransactionsHttpAdapter`.

- [ ] **Step 4: Update MSW mock with same shape**

`packages/api-client/src/msw/transactions.ts` — reescribir para responder los nuevos paths con datos en memoria. Estructura análoga a la actual; cada endpoint mockea su shape exacto. Mantén `mockStore.transactions` pero reemplaza el `timeline` por `TimelineEvent[]`. Añade endpoint mock para `/sellers/onboard` que devuelve `{ account_id: 'acct_mock', onboarding_url: null, charges_enabled: true }` para no bloquear el flow en dev.

- [ ] **Step 5: Tests**

Adaptar `packages/api-client/src/__tests__/http.test.ts` para cubrir el nuevo header `Authorization: Bearer`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api-client): rewrite Transaction adapter and port for real backend endpoints"
```

---

## Task 4: Hooks (TanStack Query wrappers)

**Files:**
- Create: `apps/web/features/transactions/hooks/*.ts`

Crea un hook por método del port. Patrón:

- `useReserveListing()` — useMutation → devuelve `client_secret` y `transaction_id`.
- `useBuyerTransaction(id)` — useQuery con `refetchInterval: 10_000`.
- `useSellerTransaction(id)` — idem.
- `useTransferInProgress(id)` — useMutation, invalida `['transactions', 'seller', id]`.
- `useSubmitProof(id)` — useMutation que pide presigned URL → sube a S3 → llama a `submitProofUrl()`.
- `useConfirmTransfer(id)` — useMutation, invalida `['transactions', 'buyer', id]`.
- `useOpenDispute(id)` — useMutation.
- `useSellerProblemReport(id)` — useMutation.
- `useMyPurchases(query)` y `useMySales(query)` — useQuery con `keepPreviousData`.
- `useOnboardSeller()` — useMutation, abre `onboarding_url` en nueva pestaña si viene.

Una vez creados, commit:

```bash
git add -A
git commit -m "feat(transactions): TanStack Query hooks for all transaction endpoints"
```

---

## Task 5: Seller onboarding page (UC-03 prerequisito)

**Files:**
- Create: `apps/web/app/(app)/vender/onboarding/page.tsx`
- Modify: `apps/web/app/(app)/vender/page.tsx` (redirect a onboarding si `charges_enabled=false`)

Pantalla simple con:
- Estado actual de la cuenta Stripe Connect (`charges_enabled` true/false).
- Botón "Configurar pagos" → llama `useOnboardSeller()` → abre `onboarding_url` o redirect.
- Banner explicando "Antes de poder vender necesitas conectar tu cuenta bancaria con Stripe (proceso de 2 minutos)".

Commit: `feat(transactions): UC-03 seller Stripe Connect onboarding`.

---

## Task 6: Buy button + checkout page (UC-06)

**Files:**
- Create: `apps/web/components/dorsal/buy-button.client.tsx`
- Modify: `apps/web/app/(app)/dorsales/[id]/page.tsx` (insertar BuyButton). **Atención:** coordinar con `feat/dorsales` si ya editó esta página.
- Create: `apps/web/app/(app)/compra/checkout/[dorsalId]/page.tsx`
- Create: `apps/web/features/transactions/components/checkout-form.client.tsx`

Flow:
1. Detalle de dorsal → `<BuyButton />` (Client Component que chequea `canBuyDorsal()` de `@dorsal/domain`).
2. `/compra/checkout/[dorsalId]` (Server Component) hace `getDorsalDetail()` para mostrar resumen.
3. `<CheckoutForm dorsalId>` (Client):
   - Llama `useReserveListing()` para obtener `client_secret`.
   - Monta `<Elements stripe={getStripe()} options={{ clientSecret }}>`.
   - Dentro, `<PaymentElement />` + botón "Pagar".
   - Al confirmar, Stripe redirige (`if_required: false`) → vuelve la pantalla con success → redirect a `/compra/confirmada?tx=<id>`.

Si `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está vacío (dev sin Stripe), muestra modo mock con botón "Simular pago" que avanza directamente al estado paid.

Commit: `feat(transactions): UC-06 reserve + Stripe checkout flow`.

---

## Task 7: Confirmation page

**Files:**
- Modify: `apps/web/app/(app)/compra/confirmada/page.tsx`

Lee `?tx=` del query string, hace `useBuyerTransaction(tx)`, muestra:
- Confirmación visual (CheckCircle).
- Estado actual del envío de datos al seller.
- Link "Ver estado completo de la compra" → `/compra/[transactionId]`.
- Link "Mi historial" → `/perfil/historial`.

Commit: `feat(transactions): post-payment confirmation page`.

---

## Task 8: Tracking page (UC-07/08) — rol-aware

**Files:**
- Create: `apps/web/components/transaction/tracking-timeline.client.tsx`
- Create: `apps/web/components/transaction/tracking-step.tsx`
- Create: `apps/web/components/transaction/transfer-actions.client.tsx`
- Create: `apps/web/components/transaction/confirm-action.client.tsx`
- Create: `apps/web/components/transaction/proof-uploader.client.tsx`
- Modify: `apps/web/app/(app)/compra/[transactionId]/page.tsx`

La página detecta el rol del usuario actual contra `buyer_id`/`seller_id` y pide el endpoint correspondiente:
- Si soy buyer → `useBuyerTransaction(id)`. Acciones disponibles: `confirmTransfer`, `openDispute` (este último solo si `status ∈ {paid, transfer_in_progress, transfer_proof_submitted}`).
- Si soy seller → `useSellerTransaction(id)`. Acciones: `markTransferInProgress`, `proofUploader` (subir prueba), y si la transacción está `released_to_seller` o `refunded_to_buyer`, mostrar `<SellerProblemReport />`.

El timeline se renderiza desde `timeline: TimelineEvent[]` mapeando cada tipo a un label y un icono.

`<ProofUploader />` interno:
1. Llama `getProofUploadUrl()` con el `contentType` del file (image/pdf).
2. Hace PUT/POST directo a S3 con el archivo.
3. Llama `submitProofUrl()` con el `final_url`.
4. Alternativa más sencilla si el dev quiere: `uploadProofMultipart()` (un solo round-trip).

Commit: `feat(transactions): UC-07/08 rol-aware tracking with proof upload`.

---

## Task 9: Dispute dialog (UC-03 buyer)

**Files:**
- Create: `apps/web/components/transaction/dispute-dialog.client.tsx`

Dialog con `<Textarea>` (mínimo 20 caracteres), botón "Abrir disputa". Llama `useOpenDispute()`. Tras éxito, muestra toast y cierra dialog. La transacción pasa a `disputed` y el siguiente refetch lo refleja.

Commit: `feat(transactions): UC-03 buyer dispute dialog`.

---

## Task 10: Seller problem report (post-final support)

**Files:**
- Create: `apps/web/components/transaction/seller-problem-report.client.tsx`

Form con:
- `Select` categoría (4 opciones del enum).
- `Textarea` mensaje (10-1000 caracteres).
- Multifile `<Input type="file" multiple>` (max 3 archivos, 10MB cada uno; jpeg/png/webp/pdf).
- Solo visible para el seller cuando `status ∈ ['released_to_seller', 'refunded_to_buyer']`.

Commit: `feat(transactions): seller problem report post-final flow`.

---

## Task 11: History page integration (UC-10)

**Files:**
- Modify: `apps/web/app/(app)/perfil/historial/page.tsx` (o crearla si `feat/usuarios` no la ha tocado todavía)

Si `feat/usuarios` ya creó la página, esta rama solo añade los hooks que la página consume (`useMyPurchases`, `useMySales`). Si no la creó, esta rama renderiza la página entera. **Coordinar con el dev de `feat/usuarios`** para evitar conflicto: quien abra el PR primero, deja anotado en la descripción que tocó esta página; el segundo PR resuelve el merge en local antes de abrir.

Commit: `feat(transactions): UC-10 wire purchases/sales hooks into history page`.

---

## Task 12: E2E happy path

**Files:**
- Create: `apps/web/e2e/purchase.spec.ts`

Test E2E que ejecuta:
1. Login con seed user.
2. Navega a `/dorsales` y pincha un dorsal NO propio.
3. Click "Comprar".
4. En checkout, si Stripe está mockeado, click "Simular pago"; si no, rellena tarjeta test 4242 4242 4242 4242.
5. Espera redirect a `/compra/confirmada`.
6. Navega a `/compra/[tx]` y verifica timeline con `payment_succeeded`.

Commit: `test(transactions): E2E purchase happy path`.

---

## Task 13: Final verification + PR

- [ ] **Step 1: Local pipeline**

```bash
pnpm turbo run lint typecheck test build
pnpm --filter @dorsal/web test:e2e
```

- [ ] **Step 2: Push y abrir PR**

```bash
git push -u origin feat/transacciones
# PR title: "feat(transacciones): UC-03, UC-06, UC-07, UC-08 — Transaction module"
# Base: feat/foundation
```

PR description:
- UCs cubiertos con tasks correspondientes.
- Captura de checkout + tracking + dispute + seller problem report.
- Nota: requiere backend Transaction levantado o `NEXT_PUBLIC_REAL_API_MODULES` sin `transactions` para correr con mock.

---

## Self-review

**Spec coverage:**

| UC | Tasks |
|---|---|
| UC-03 escrow + disputas | Tasks 5 (onboarding), 9 (dispute), 10 (seller problem reports) |
| UC-06 compra | Tasks 6, 7 |
| UC-07/08 timeline + soporte | Task 8 |
| UC-10 historial (compras+ventas) | Task 11 |

**Backend contract coverage:**

| Endpoint Postman | Task |
|---|---|
| `POST /sellers/onboard` | Task 5 |
| `POST /transactions` (reserve) | Task 6 |
| `GET /transactions/buyer/{id}` | Task 8 |
| `GET /transactions/seller/{id}` | Task 8 |
| `POST /transactions/{id}/proof-upload-url` | Task 8 |
| `POST /transactions/{id}/transfer-in-progress` | Task 8 |
| `POST /transactions/{id}/upload-proof` | Task 8 |
| `POST /transactions/{id}/proof` | Task 8 |
| `POST /transactions/{id}/confirm` | Task 8 |
| `POST /transactions/{id}/dispute` | Task 9 |
| `POST /transactions/{id}/seller-problem-reports` | Task 10 |
| `GET /me/purchases`, `GET /me/sales` | Task 11 |

**ADRs:**
- ADR-006 Server Components: tasks 6 y 7 son SC, el resto Client (interactividad heavy).
- ADR-007 TanStack Query: Task 4 cubre todos los hooks; polling 10s en tracking.
- ADR-011 Presigned uploads: Task 8 implementa flujo presign + upload directo a S3.
- ADR-015 Observabilidad: Task 1 wire Sentry no-op.

**Placeholder scan:** none.

**Type consistency:** los nombres `TransactionStatus`, `BuyerTransactionDetail`, `SellerTransactionDetail`, `TimelineEvent`, `SellerProblemReport` se usan de manera consistente entre schemas → port → adapter → hooks → componentes.

**Open follow-ups (post-MVP, fuera de scope):**
- Admin panel: list/resolve disputes y seller problem reports. El backend ya expone estos endpoints; cuando se necesite, sale como `feat/admin`.
- Real-time chat: el contrato actual no incluye mensajería bidireccional dentro de la transacción. Si se añade, el frontend usará polling primero y WebSocket cuando el backend lo exponga.
- Reseñas (UC-11) tras `confirmed` o `released_to_seller`: depende del módulo Review (mock por ahora).

**Migración del Auth header.** El backend está migrando de `X-User-Id` (Catalog) a `Authorization: Bearer <JWT>` (Transaction). El http client de foundation se amplía en Task 3 step 1 para enviar ambos cuando hay sesión Auth.js; cada módulo del backend usa el suyo.
