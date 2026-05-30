# feat/transacciones Identity Auth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Transaction frontend to match the backend once `MVP-Dorsales` Identity/Cognito removes spoofable actor IDs from protected transaction requests and relies on `Authorization: Bearer <JWT>`.

**Architecture:** Transaction UI stays responsible for onboarding, reservation, tracking, proof, disputes, seller problem reports, and history. Actor identity comes from the authenticated bearer token injected by the shared HTTP client, not from `buyerId`/`sellerId` props or request bodies. During migration, adapters may support legacy body IDs behind tests, but the final real mode must use the authenticated contract.

**Tech Stack:** Next.js App Router, Auth.js v5, TanStack Query, Zod, MSW, Vitest, Playwright, `@dorsal/api-client`, `@dorsal/schemas`.

---

## Backend Baseline

Reviewed on 2026-05-30:

- Current `MVP-Dorsales origin/main` Transaction routes exist and are used by the frontend.
- Latest Identity plan (`origin/feature/identity`) explicitly requires removing spoofable actor IDs from protected Transaction routes.
- Latest UC-09 branch still has a compatibility comment in `transaction_schemas.py`: actor IDs remain in request bodies for legacy payment/proof routes that have not moved to authenticated principals yet.

Current frontend still sends actor IDs in these calls:

```text
POST /api/v1/sellers/onboard                         body.user_id
POST /api/v1/transactions                            body.buyer_id
POST /api/v1/transactions/{id}/proof-upload-url      body.seller_id
POST /api/v1/transactions/{id}/transfer-in-progress  body.seller_id
POST /api/v1/transactions/{id}/proof                 body.seller_id
POST /api/v1/transactions/{id}/confirm               body.buyer_id
POST /api/v1/transactions/{id}/dispute               body.buyer_id
```

Target frontend contract after backend auth cutover:

```text
POST /api/v1/sellers/onboard                         body {}
POST /api/v1/transactions                            body { dorsal_id }
POST /api/v1/transactions/{id}/proof-upload-url      body { content_type }
POST /api/v1/transactions/{id}/transfer-in-progress  body {}
POST /api/v1/transactions/{id}/proof                 body { proof_file_url }
POST /api/v1/transactions/{id}/confirm               body {}
POST /api/v1/transactions/{id}/dispute               body { reason }
```

All protected calls must include `Authorization: Bearer <JWT>` through `createHttp({ getAuthToken })`.

---

## File Structure

```text
packages/schemas/src/transaction.ts
packages/api-client/src/ports/transactions.ts
packages/api-client/src/adapters/transactions-http.ts
packages/api-client/src/msw/transactions.ts
packages/api-client/src/__tests__/transactions-http.test.ts
packages/api-client/src/__tests__/http.test.ts
apps/web/features/transactions/hooks/
apps/web/features/transactions/components/checkout-form.client.tsx
apps/web/components/transaction/*.tsx
apps/web/e2e/purchase.spec.ts
docs/reviews/2026-05-24-feat-transacciones-qa-notes.md
```

---

## Task 1: Confirm Backend Cutover Before Editing

**Files:**
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/input/rest/schemas/transaction_schemas.py`
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/input/rest/controllers/transaction/purchase_controller.py`
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/input/rest/controllers/transaction/tracking_controller.py`

- [ ] **Step 1: Check whether backend still requires actor IDs**

```bash
git -C ../MVP-Dorsales grep -n "buyer_id\\|seller_id\\|user_id" origin/feature/UC-09-runner-profile -- dorsales_api/infrastructure/adapters/input/rest/schemas/transaction_schemas.py dorsales_api/infrastructure/adapters/input/rest/controllers/transaction
```

Expected before backend cutover: actor IDs still appear in request schemas.

Expected after backend cutover: protected route handlers use `authenticated_user_id(request)` and request schemas no longer require actor IDs.

- [ ] **Step 2: Only proceed when backend target branch is available**

Proceed with Tasks 2-8 when backend has a branch or PR implementing UC-01 Task 7 "Remove Spoofable Actor IDs From Protected Routes".

---

## Task 2: Update Transaction Port To Authenticated Actor Contract

**Files:**
- Modify: `packages/api-client/src/ports/transactions.ts`
- Test: `packages/api-client/src/__tests__/transactions-http.test.ts`

- [ ] **Step 1: Update interface signatures**

Change from actor-id arguments to authenticated-user methods:

```ts
export interface TransactionsPort {
  onboardSeller(): Promise<SellerOnboardingResponse>;
  reserveListing(input: { dorsalId: string }): Promise<ReserveListingResponse>;
  getProofUploadUrl(id: string, input: { contentType: string }): Promise<ProofUploadUrlResponse>;
  submitProofUrl(id: string, input: { proofFileUrl: string }): Promise<SellerTransactionDetail>;
  markTransferInProgress(id: string): Promise<SellerTransactionDetail>;
  confirmTransfer(id: string): Promise<BuyerTransactionDetail>;
  openDispute(id: string, input: { reason: string }): Promise<Dispute>;
}
```

Keep `getBuyerTransaction`, `getSellerTransaction`, `uploadProofMultipart`, `createSellerProblemReport`, `listMyPurchases`, and `listMySales` unchanged unless backend route paths change.

- [ ] **Step 2: Update compile errors intentionally**

Run:

```bash
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/web typecheck
```

Expected: frontend callers fail where they still pass `buyerId`/`sellerId`. Fix them in later tasks.

---

## Task 3: Update HTTP Adapter Request Bodies

**Files:**
- Modify: `packages/api-client/src/adapters/transactions-http.ts`
- Modify: `packages/api-client/src/__tests__/transactions-http.test.ts`

- [ ] **Step 1: Rewrite adapter tests**

Assert new body shapes:

```ts
expect(post).toHaveBeenCalledWith('api/v1/sellers/onboard', { body: {} });
expect(post).toHaveBeenCalledWith('api/v1/transactions', { body: { dorsal_id: dorsalId } });
expect(post).toHaveBeenCalledWith(`api/v1/transactions/${id}/confirm`, { body: {} });
expect(post).toHaveBeenCalledWith(`api/v1/transactions/${id}/dispute`, { body: { reason } });
```

- [ ] **Step 2: Implement adapter**

Use:

```text
onboardSeller() -> POST api/v1/sellers/onboard body {}
reserveListing({ dorsalId }) -> POST api/v1/transactions body { dorsal_id }
getProofUploadUrl(id, { contentType }) -> POST .../proof-upload-url body { content_type }
markTransferInProgress(id) -> POST .../transfer-in-progress body {}
submitProofUrl(id, { proofFileUrl }) -> POST .../proof body { proof_file_url }
confirmTransfer(id) -> POST .../confirm body {}
openDispute(id, { reason }) -> POST .../dispute body { reason }
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/api-client test -- transactions-http.test.ts
pnpm --filter @dorsal/api-client typecheck
```

Expected: pass.

---

## Task 4: Align Response Schemas With Backend Names

**Files:**
- Modify: `packages/schemas/src/transaction.ts`
- Modify: `packages/schemas/src/__tests__/transaction.test.ts`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`

- [ ] **Step 1: Reserve response**

Backend schema currently exposes:

```text
transaction_id
payment_client_secret
reservation_expires_at
```

Update `ReserveListingResponse` accordingly. If Stripe UI still wants `clientSecret`, derive it in component code from `payment_client_secret`; do not keep schema names that the backend does not return.

- [ ] **Step 2: Detail/history schemas**

Compare against backend schemas:

```text
BuyerTransactionDetailResponseSchema
SellerTransactionDetailResponseSchema
TransactionHistoryItemSchema
TransactionHistoryResponseSchema
ProofUploadUrlResponseSchema
CreateSellerProblemReportResponseSchema
```

Update Zod schemas to accept backend names such as `transaction_id`, `order_summary`, `seller_contact`, `buyer_contact`, `buyer_profile`, `lifecycle_state`, `technical_status`, `ui_status`, `ui_status_label`, `file_url`.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/schemas test -- transaction.test.ts
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 5: Update Web Callers

**Files:**
- Modify: `apps/web/features/transactions/hooks/use-onboard-seller.ts`
- Modify: `apps/web/features/transactions/hooks/use-reserve-listing.ts`
- Modify: `apps/web/features/transactions/hooks/use-transfer-in-progress.ts`
- Modify: `apps/web/features/transactions/hooks/use-submit-proof.ts`
- Modify: `apps/web/features/transactions/hooks/use-confirm-transfer.ts`
- Modify: `apps/web/features/transactions/hooks/use-open-dispute.ts`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Modify: `apps/web/components/transaction/*.tsx`

- [ ] **Step 1: Remove session user IDs from mutation variables**

Examples:

```ts
api.transactions.onboardSeller()
api.transactions.reserveListing({ dorsalId })
api.transactions.markTransferInProgress(transactionId)
api.transactions.confirmTransfer(transactionId)
api.transactions.openDispute(transactionId, { reason })
```

Keep Auth.js session checks for UX, but do not pass actor IDs to the API client.

- [ ] **Step 2: Checkout**

Still require `session.user.token` or an authenticated session before reserve. Then call:

```ts
const result = await reserve.mutateAsync({ dorsalId });
setClientSecret(result.payment_client_secret);
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/web test -- checkout-form.test.tsx
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 6: Update MSW To Match Authenticated Contract

**Files:**
- Modify: `packages/api-client/src/msw/transactions.ts`
- Modify: `packages/api-client/src/msw/store.ts`

- [ ] **Step 1: Use current user from headers/session**

In MSW, keep a helper that resolves current user from:

```text
Authorization mock token, if present
X-User-Id only for legacy local preview
SEED_USER_ID fallback only in explicit mocked mode
```

- [ ] **Step 2: Remove required actor IDs from request parsing**

MSW handlers should not require `buyer_id`, `seller_id`, or `user_id` in the body for protected transaction flows.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/api-client test
pnpm --filter @dorsal/web test -- checkout-form.test.tsx
```

Expected: pass.

---

## Task 7: Ensure Bearer Token Injection Is The Real Path

**Files:**
- Modify: `packages/api-client/src/http.ts`
- Modify: `packages/api-client/src/__tests__/http.test.ts`
- Modify: `apps/web/lib/api-client.ts`
- Modify: `apps/web/types/next-auth.d.ts`

- [ ] **Step 1: HTTP tests**

Assert protected transaction requests include `Authorization` when `getAuthToken()` returns a token.

Also assert `X-User-Id` is not required for transaction calls in real users mode.

- [ ] **Step 2: API client factory**

Ensure `getAuthToken` reads `session.user.token`, where Auth.js stores the Cognito token from `feat/usuarios`.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/api-client test -- http.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 8: E2E Purchase Regression

**Files:**
- Modify: `apps/web/e2e/purchase.spec.ts`
- Modify: `docs/reviews/2026-05-24-feat-transacciones-qa-notes.md`

- [ ] **Step 1: Update E2E login setup**

Use the auth helper from `feat/usuarios` so the purchase flow has a token-bearing session. Do not seed purchases by passing buyer/seller IDs into the UI.

- [ ] **Step 2: Cover no-spoof body**

If Playwright network inspection is available, assert reserve request body is exactly:

```json
{ "dorsal_id": "<id>" }
```

- [ ] **Step 3: Revisit reservation availability bug**

The 2026-05-24 note still stands until backend confirms that published dorsals are reservable or the UI marks a different state as purchasable.

- [ ] **Step 4: Run**

```bash
pnpm --filter @dorsal/web test:e2e -- e2e/purchase.spec.ts
```

Expected: pass when backend Catalog/Transaction/Identity are all running against compatible data.

---

## Task 9: Final Verification And PR

- [ ] **Step 1: Full focused checks**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/api-client test
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/web test
pnpm --filter @dorsal/web build
```

- [ ] **Step 2: E2E**

```bash
pnpm --filter @dorsal/web test:e2e -- e2e/purchase.spec.ts
```

- [ ] **Step 3: PR**

```text
Title: fix(transactions): use authenticated actor contract
Base: feat/foundation
```

PR notes:

```text
- Removes buyer_id/seller_id/user_id from protected transaction request bodies.
- Requires Cognito/Auth.js session token injection from feat/usuarios.
- Aligns transaction response schemas with backend Pydantic names.
- Keeps MSW fallback for local mocked transaction development.
```

---

## Self-Review

Spec coverage:

| Need | Covered by |
|---|---|
| Remove spoofable actor IDs | Tasks 2, 3, 5, 6 |
| Use Cognito bearer token | Task 7 |
| Align response schemas | Task 4 |
| Preserve purchase flow | Tasks 5, 8 |
| Track reservation availability mismatch | Task 8 |

Backend compatibility:

| Backend fact | Front plan response |
|---|---|
| Identity resolves local user from JWT | API client sends Authorization bearer |
| Protected transaction routes should not trust body actor IDs | Port and adapter remove them |
| Current backend still has legacy actor fields in some schemas | Task 1 gates execution until cutover branch exists |
| Reserve response uses `payment_client_secret` | Schema and checkout use backend name |
