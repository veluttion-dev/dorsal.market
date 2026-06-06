# feat/usuarios Backend Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replan `feat/usuarios` so the frontend matches the latest `MVP-Dorsales` Identity/Cognito work: Cognito-owned auth, `GET/PATCH /api/v1/me`, public profiles, and `runner_data_complete` as the purchase gate.

**Architecture:** Auth.js remains the frontend session boundary, but real auth comes from Cognito/OIDC rather than backend password endpoints. `packages/schemas` exposes the backend's flat profile contract; `packages/api-client` keeps the port abstraction and supports MSW only when `users` is not in `NEXT_PUBLIC_REAL_API_MODULES`. Transaction checkout consumes user hooks only to validate profile readiness, while transaction history stays owned by `feat/transacciones`.

**Tech Stack:** Next.js App Router, Auth.js v5, Cognito Hosted UI/OIDC, TanStack Query, React Hook Form, Zod, MSW, Vitest, Playwright, `@dorsal/api-client`, `@dorsal/schemas`.

---

## Backend Baseline

Reviewed on 2026-05-30:

- `MVP-Dorsales origin/main`: Catalog + Transaction + Terraform/pre infra are present.
- `MVP-Dorsales origin/feature/identity`: UC-01 Cognito/local user model exists; domain uses provider-neutral `idp_sub`.
- `MVP-Dorsales origin/feature/UC-09-runner-profile`: latest profile contract adds partial `PATCH /api/v1/me`, public profile, `EstimatedTime`, and `runner_data_complete`.
- AWS pre outputs:
  - API: `https://qvdpnzcyzf.execute-api.eu-west-1.amazonaws.com`
  - Cognito User Pool: `eu-west-1_lwL5qYgyF`
  - Cognito Client ID: `4qgmipgbv45f2roaju09bl0sk3`
  - Hosted UI domain prefix: `dorsales-pre`

Current backend Identity routes to target after merge/deploy:

```text
GET   /api/v1/me
PATCH /api/v1/me
GET   /api/v1/users/{user_id}/public
```

Do not target these obsolete routes for real mode:

```text
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/users/me
PATCH /api/v1/users/me
GET  /api/v1/users/{id}
```

---

## File Structure

```text
apps/web/
  app/(auth)/login/page.tsx
  app/(auth)/registro/page.tsx
  app/(app)/perfil/page.tsx
  app/(app)/perfil/completar/page.tsx
  features/users/
    components/
      login-form.client.tsx
      register-form.client.tsx
      profile-form.client.tsx
      profile-completion-notice.client.tsx
    hooks/
      use-me.ts
      use-patch-profile.ts
      use-public-profile.ts
    lib/
      auth-mode.ts
      profile-completion.ts
    __tests__/
      auth-mode.test.ts
      profile-completion.test.ts
packages/schemas/src/user.ts
packages/api-client/src/ports/users.ts
packages/api-client/src/adapters/users-http.ts
packages/api-client/src/msw/users.ts
packages/api-client/src/__tests__/users-http.test.ts
apps/web/features/transactions/components/checkout-form.client.tsx
apps/web/features/transactions/components/buyer-data-notice.client.tsx
```

---

## Task 1: Branch And Contract Baseline

**Files:**
- Read: `docs/branches/feat-usuarios.md`
- Read: `../MVP-Dorsales/docs/features/identity/spec/2026-05-27-uc01-cognito-identity-plan.md` from `origin/feature/identity`
- Read: `../MVP-Dorsales/docs/superpowers/specs/2026-05-30-uc09-runner-profile-design.md` from `origin/feature/UC-09-runner-profile`
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/input/rest/schemas/identity_schemas.py` from `origin/feature/UC-09-runner-profile`

- [ ] **Step 1: Create branch**

```bash
git switch feat/foundation
git pull
git switch -c feat/usuarios
```

Expected: `git branch --show-current` prints `feat/usuarios`.

- [ ] **Step 2: Confirm backend route contract**

```bash
git -C ../MVP-Dorsales show origin/feature/UC-09-runner-profile:dorsales_api/infrastructure/adapters/input/rest/controllers/identity/identity_controller.py
git -C ../MVP-Dorsales show origin/feature/UC-09-runner-profile:dorsales_api/infrastructure/adapters/input/rest/schemas/identity_schemas.py
```

Expected: routes are `/api/v1/me` for `GET/PATCH` and `/api/v1/users/{user_id}/public` for public profile.

- [ ] **Step 3: Baseline frontend checks**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/web typecheck
```

Expected: all pass before implementation starts.

---

## Task 2: Replace User Schemas With Backend Flat Profile Contract

**Files:**
- Modify: `packages/schemas/src/user.ts`
- Test: `packages/schemas/src/__tests__/user.test.ts`

- [ ] **Step 1: Add schema tests**

Cover `UserProfile`, `PatchUserProfileInput`, and `PublicUserProfile`. `PatchUserProfileInput` must accept partial payloads, including `{ estimated_time: null }`, and reject malformed `estimated_time`.

- [ ] **Step 2: Implement schemas**

Define `UserProfile` with the exact backend fields:

```text
id, email, first_name, last_name, dni, gender, age,
phone_number, whatsapp_number, postal_code, address,
estimated_time, t_shirt_size, club, federation_license,
medical_info, emergency_contact, additional_info,
profile_complete, runner_data_complete
```

Define `PatchUserProfileInput` as the same profile fields minus `id`, `email`, `profile_complete`, and `runner_data_complete`, all partial.

Define `PublicUserProfile` with:

```text
id, full_name, avg_rating_seller, avg_rating_buyer,
total_sales, total_purchases, profile_complete
```

Keep legacy `RegisterInput` and `LoginInput` only for MSW/local Credentials fallback.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/schemas test -- user.test.ts
pnpm --filter @dorsal/schemas typecheck
```

Expected: tests and typecheck pass.

---

## Task 3: Update Users Port, HTTP Adapter, And MSW

**Files:**
- Modify: `packages/api-client/src/ports/users.ts`
- Modify: `packages/api-client/src/adapters/users-http.ts`
- Modify: `packages/api-client/src/msw/users.ts`
- Test: `packages/api-client/src/__tests__/users-http.test.ts`

- [ ] **Step 1: Write adapter tests**

Assert the real adapter calls:

```ts
await adapter.getMe();
expect(get).toHaveBeenCalledWith('api/v1/me');

await adapter.patchMe({ first_name: 'Ana' });
expect(patch).toHaveBeenCalledWith('api/v1/me', { body: { first_name: 'Ana' } });

await adapter.getPublicProfile('550e8400-e29b-41d4-a716-446655440001');
expect(get).toHaveBeenCalledWith('api/v1/users/550e8400-e29b-41d4-a716-446655440001/public');
```

- [ ] **Step 2: Update port**

Use this shape:

```ts
export interface UsersPort {
  register(input: RegisterInput): Promise<SessionUser>; // MSW/local only
  login(email: string, password: string): Promise<SessionUser>; // MSW/local only
  getMe(): Promise<UserProfile>;
  patchMe(input: PatchUserProfileInput): Promise<UserProfile>;
  getPublicProfile(id: string): Promise<PublicUserProfile>;
}
```

- [ ] **Step 3: Update HTTP adapter**

Real mode methods:

```text
getMe() -> GET api/v1/me
patchMe(input) -> PATCH api/v1/me
getPublicProfile(id) -> GET api/v1/users/${id}/public
```

Make `register()` and `login()` fail clearly in real HTTP mode unless a real backend auth endpoint is added later. Cognito owns those flows.

- [ ] **Step 4: Update MSW**

Mirror the real route paths:

```text
GET   /api/v1/me
PATCH /api/v1/me
GET   /api/v1/users/:id/public
```

Keep `POST /api/v1/auth/login` and `POST /api/v1/auth/register` only for local Credentials fallback.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @dorsal/api-client test -- users-http.test.ts factory.test.ts
pnpm --filter @dorsal/api-client typecheck
```

Expected: pass.

---

## Task 4: Configure Real Auth Around Cognito

**Files:**
- Modify: `apps/web/lib/auth.ts`
- Modify: `apps/web/auth.config.ts`
- Modify: `apps/web/types/next-auth.d.ts`
- Create: `apps/web/features/users/lib/auth-mode.ts`
- Test: `apps/web/features/users/__tests__/auth-mode.test.ts`

- [ ] **Step 1: Add auth mode helper**

```ts
export function isUsersMocked(realModules = process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '') {
  return !realModules.split(',').map((m) => m.trim()).filter(Boolean).includes('users');
}
```

- [ ] **Step 2: Add Cognito/OIDC provider**

Use deployed pre values through env vars, not hardcoded in code:

```env
AUTH_COGNITO_ID=4qgmipgbv45f2roaju09bl0sk3
AUTH_COGNITO_ISSUER=https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_lwL5qYgyF
AUTH_COGNITO_CLIENT_SECRET=
```

If the app client is public and has no secret, configure Auth.js provider accordingly. Store the access/id token in the JWT callback and expose `session.user.token`.

- [ ] **Step 3: Keep Credentials only for local mocked users**

Credentials fallback is allowed only when:

```text
NODE_ENV=development
users is absent from NEXT_PUBLIC_REAL_API_MODULES
```

Do not use Credentials against real `MVP-Dorsales`.

- [ ] **Step 4: Verify**

```bash
pnpm --filter @dorsal/web test -- auth-mode.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 5: Profile Pages With PATCH Semantics

**Files:**
- Create/Modify: `apps/web/features/users/hooks/use-me.ts`
- Create/Modify: `apps/web/features/users/hooks/use-patch-profile.ts`
- Create/Modify: `apps/web/features/users/components/profile-form.client.tsx`
- Modify: `apps/web/app/(app)/perfil/page.tsx`
- Modify: `apps/web/app/(app)/perfil/completar/page.tsx`

- [ ] **Step 1: Hooks**

`useMe()` calls `api.users.getMe()`.

`usePatchProfile()` calls `api.users.patchMe(input)` and updates query cache `['users', 'me']`.

- [ ] **Step 2: Form fields**

Render fields matching backend flat names:

```text
first_name, last_name, dni, gender, age,
phone_number, whatsapp_number, postal_code, address,
estimated_time, t_shirt_size, club, federation_license,
medical_info, emergency_contact, additional_info
```

Use PATCH partial payloads. Only send dirty fields to avoid overwriting existing profile data with nulls.

- [ ] **Step 3: `/perfil/completar` redirect**

After save, if `profile_complete` and `runner_data_complete` are true, redirect to `callbackUrl` or `/perfil`.

- [ ] **Step 4: Verify**

```bash
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/web test -- profile-completion.test.ts
```

Expected: pass.

---

## Task 6: Profile Completion Helpers And Checkout Gate

**Files:**
- Create/Modify: `apps/web/features/users/lib/profile-completion.ts`
- Modify: `apps/web/features/transactions/components/buyer-data-notice.client.tsx`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Test: `apps/web/features/users/__tests__/profile-completion.test.ts`
- Test: `apps/web/features/transactions/components/__tests__/checkout-form.test.tsx`

- [ ] **Step 1: Helpers**

Use backend booleans first:

```ts
export function canBuyWithProfile(user: UserProfile | null | undefined) {
  return Boolean(user?.profile_complete && user?.runner_data_complete);
}
```

For UI copy, calculate missing display fields from the latest UC-09 rule:

```text
estimated_time
t_shirt_size
emergency_contact
```

Also show `profile_complete` missing when identity fields are incomplete.

- [ ] **Step 2: Checkout integration**

Before calling `reserveListing`, call `useMe()`. If `canBuyWithProfile(user)` is false:

```ts
toast.error('Completa tus datos de corredor antes de comprar');
router.push(`/perfil/completar?callbackUrl=${encodeURIComponent(currentCheckoutUrl)}`);
return;
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/web test -- profile-completion.test.ts checkout-form.test.tsx
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 7: Preserve Transaction History

**Files:**
- Verify: `apps/web/app/(app)/perfil/historial/page.tsx`
- Verify: `apps/web/features/transactions/hooks/use-my-purchases.ts`
- Verify: `apps/web/features/transactions/hooks/use-my-sales.ts`

- [ ] **Step 1: Keep transaction hooks**

Do not reintroduce `api.transactions.listMine()` or user-owned history components. The page must continue to use:

```ts
useMyPurchases()
useMySales()
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 8: Reviews Stay Mocked Until Backend Contract Stabilizes

**Files:**
- Modify: `packages/schemas/src/review.ts`
- Modify: `packages/api-client/src/ports/reviews.ts`
- Modify: `packages/api-client/src/msw/reviews.ts`
- Modify: `apps/web/features/users/components/review-form.client.tsx`

- [ ] **Step 1: Keep reviews out of real modules**

Do not add `reviews` to `NEXT_PUBLIC_REAL_API_MODULES` until the back Review branch is merged into the same line as Identity/Transaction and route contracts are confirmed.

- [ ] **Step 2: Integrate review UI only behind transaction final states**

Show review form when transaction status is one of:

```text
confirmed
released_to_seller
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/web test -- review-form.test.tsx
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

---

## Task 9: E2E Auth And Profile

**Files:**
- Create: `apps/web/e2e/auth.spec.ts`
- Create: `apps/web/e2e/profile.spec.ts`

- [ ] **Step 1: Local MSW path**

Cover:

```text
Credentials demo login works only when users mocked
registro creates local mocked user and lands on /perfil/completar
profile PATCH updates runner fields
checkout redirects/blocks when runner_data_complete is false
```

- [ ] **Step 2: Pre Cognito smoke path**

When Cognito test credentials are available, cover:

```text
Hosted UI login returns to app
GET /api/v1/me succeeds with Authorization bearer token
PATCH /api/v1/me updates one field without clearing the others
```

- [ ] **Step 3: Run**

```bash
pnpm --filter @dorsal/web test:e2e -- e2e/auth.spec.ts e2e/profile.spec.ts
```

Expected: local MSW path passes. Pre Cognito path may be skipped unless secrets/test user are configured.

---

## Task 10: Final Verification And PR

- [ ] **Step 1: Local verification**

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
pnpm --filter @dorsal/web test:e2e -- e2e/auth.spec.ts e2e/profile.spec.ts
```

- [ ] **Step 3: PR**

```text
Title: feat(usuarios): Cognito auth and runner profile sync
Base: feat/foundation
```

PR notes:

```text
- Real auth uses Cognito/OIDC; backend does not expose password login/register endpoints.
- User profile uses GET/PATCH /api/v1/me and flat fields from MVP-Dorsales UC-09.
- Checkout gates on profile_complete and runner_data_complete.
- Reviews remain mocked until backend Review is merged into the same deployable line.
```

---

## Self-Review

Spec coverage:

| Need | Covered by |
|---|---|
| UC-01 Cognito auth | Tasks 3, 4, 9 |
| UC-09 profile | Tasks 2, 3, 5, 6 |
| UC-10 history | Task 7 |
| UC-11 reviews MVP | Task 8 |
| AWS pre context | Backend Baseline + Task 4 |

Backend compatibility:

| Backend fact | Front plan response |
|---|---|
| Real private profile route is `/api/v1/me` | Users adapter targets `api/v1/me` |
| Updates are PATCH partial | Forms send dirty fields only |
| Public profile route is `/api/v1/users/{id}/public` | Users port adds `getPublicProfile` |
| Cognito owns tokens | Auth.js uses Cognito/OIDC, Credentials only local mock |
| `runner_data_complete` exists | Checkout gate uses backend flag |
