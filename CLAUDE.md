# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`dorsal.market` — marketplace de dorsales de carrera con escrow. Monorepo pnpm + Turborepo. Web prioritario (Next.js 16); móvil (Expo) es una fase futura no implementada. Backend FastAPI hexagonal en **repo separado**.

Lee `README.md` para el panorama completo y `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md` para las 16 ADRs con el porqué de cada decisión.

## Commands

```bash
pnpm install                                  # instala todo el workspace
pnpm dev                                       # arranca apps/web en :3000

pnpm turbo run lint typecheck test build        # pipeline completo (lo que corre CI)
pnpm turbo run typecheck                        # solo tsc --noEmit en todo el monorepo
pnpm turbo run test                             # vitest run en todos los paquetes
pnpm --filter @dorsal/schemas test              # tests de un solo paquete
pnpm --filter @dorsal/web test:e2e              # Playwright (requiere navegadores instalados)
pnpm format                                     # auto-formatea con Biome
```

Un solo test: `pnpm --filter @dorsal/<pkg> exec vitest run -t "nombre del test"` o `... <ruta/al/archivo.test.ts>`.

## Entorno (importante)

- **Node ≥20** (`engines.node: ">=20.0.0"`). El CI pina **Node 20** vía `.nvmrc` para reproducibilidad, pero **Node 22 LTS también funciona** (typecheck/lint/test/build verifican verde en ambas). Lo que importa es no usar <20. Si tu shell trae una versión incompatible, activa con `nvm use` o prefija `export PATH="$HOME/.nvm/versions/node/v20.*/bin:$PATH"`. Mantén `.nvmrc` y el CI sincronizados si decides subir el pin.
- **pnpm 9.12.0** vía corepack.
- **Corre `pnpm install` tras cada pull/checkout antes de typecheck/build.** Hay deps externas (`@stripe/*`, `@sentry/nextjs`) declaradas en `apps/web/package.json` que, si no están en `node_modules`, hacen fallar `tsc` con `TS2307: Cannot find module`. Cuidado: **Turbo cachea typecheck/test**, así que un `turbo run typecheck` puede dar verde por caché aunque falte instalar; usa `--force` para verificación real.
- Artefactos de Playwright (`test-results/`, `playwright-report/`) están en `.gitignore`. Biome respeta el ignore file (`useIgnoreFile`), así que no se lintean; no los versiones.
- `apps/web` necesita `apps/web/.env.local` — cópialo de `.env.example` y pon un `NEXTAUTH_SECRET` real.
- Next.js 16 usa **Turbopack por defecto** en dev y build. `next.config.ts` es Turbopack-compatible (sin hooks `webpack`; `typedRoutes` es opción de nivel superior). No hace falta ningún flag en el script `dev`.
- **`msw/browser` nunca debe entrar al bundle servidor** (su exports map tiene `"node": null`). Por eso el arranque del worker MSW vive en `components/msw-bootstrap.tsx` y se carga con `next/dynamic({ ssr: false })` desde `providers.tsx`. Si tocas esa zona, mantén ese aislamiento.

## Arquitectura — big picture

### Monorepo
- `apps/web` — Next.js 16 App Router. Única app activa.
- `packages/schemas` — Zod schemas, **única fuente de verdad** de tipos + validación. Todo lo demás deriva de aquí (`z.infer`).
- `packages/api-client` — cliente HTTP, puertos, adapters, MSW, TanStack Query provider. Ver "Mock layer".
- `packages/domain` — lógica pura sin I/O (canBuyDorsal, formatPrice, computeTimelineProgress).
- `packages/ui-tokens` — design tokens consumidos por `tailwind.config.ts`.
- `packages/tsconfig` — configs TS base compartidas.

### Mock layer intercambiable (ADR-004 — clave del proyecto)
`packages/api-client` define un **puerto** (interfaz TS) por bounded context del backend: `DorsalsPort`, `UsersPort`, `TransactionsPort`, `ReviewsPort`. Cada puerto tiene un **HTTP adapter** real. Los módulos del backend que aún no existen se interceptan con **MSW** (`src/msw/`).

La env var `NEXT_PUBLIC_REAL_API_MODULES` (CSV) decide qué módulos van contra el backend real; el resto los mockea MSW en dev. Estado backend: Catalog, Transaction e **Identity** tienen contrato real; **Review** sigue **mockeado** (sin contrato back estable). `.env.example` trae `NEXT_PUBLIC_REAL_API_MODULES=dorsals` como default de dev.

**Catalog (`dorsals`) no tiene handler MSW** y nunca se mockea: el tipo `ApiModule` de `src/msw/index.ts` lo excluye y `msw-bootstrap.tsx` lo filtra antes de `buildHandlers`. Si trabajas el front sin backend, `dorsals` debe ir a un Catalog real en `:8000` (o ajusta el set de módulos reales). Solo hay handlers MSW para `users`, `transactions` y `reviews`.

Los componentes **nunca llaman `fetch`** — solo usan hooks de TanStack Query que envuelven los puertos. Migrar de mock a real es cambiar la env var, sin tocar UI.

### Auth
Auth.js v5 (`apps/web/lib/auth.ts`, `auth.config.ts`). El HTTP client (`packages/api-client/src/http.ts`) inyecta el header de auth: Catalog usa `X-User-Id` provisional, Transaction e Identity usan `Authorization: Bearer <JWT>`. Ambos coexisten durante la migración del backend.

**Cognito es el dueño del auth real.** El backend Identity **no expone** rutas de registro/login: el signup y el login viven en Cognito (Hosted UI/OIDC), externos al REST. El provider Cognito ya está en `apps/web/lib/auth.ts`. El provider Credentials + `POST /api/v1/auth/{login,register}` de MSW son **solo fallback de desarrollo** (seed `demo@dorsal.market` / `demo1234`) y nunca deben usarse contra el backend real ni en producción. Pre AWS: pool `eu-west-1_lwL5qYgyF`, client `4qgmipgbv45f2roaju09bl0sk3`.

### Identity (bounded context de usuarios)
Contrato real (ver `postman/identity_bounded_context.postman_collection.json`):

```text
GET   /api/v1/me                       # perfil privado, Bearer requerido (provisiona el user local)
PATCH /api/v1/me                       # update parcial; solo campos presentes; age 14-120; estimated_time HH:MM:SS
GET   /api/v1/users/{user_id}/public   # perfil público + reputación, sin auth
```

Perfil **plano** (sin objetos anidados) en `packages/schemas/src/user.ts` (`UserProfile`, `PatchUserProfileInput`, `PublicUserProfile`). El backend devuelve los flags `profile_complete` y `runner_data_complete`; **`runner_data_complete` es el gate de compra** (checkout). El front vive en `features/users` (UC-01/09/10/11) y los planes en `docs/superpowers/plans/2026-05-30-feat-usuarios-backend-sync.md`. Reviews (UC-11) siguen en MSW.

### Transaction (estados de la operación)
Contrato real (ver `postman/transaction_bounded_context.postman_collection.json`). El detalle expone `status` (técnico) y `lifecycle_state`; el listado de historial expone `technical_status`, `ui_status` y `ui_status_label`.

**`TransactionStatus` tiene un único juego canónico en MAYÚSCULAS** (`packages/schemas/src/transaction.ts`): `PENDING_PAYMENT`, `PAYMENT_RECEIVED`, `TRANSFER_IN_PROGRESS`, `TRANSFER_SUBMITTED`, `IN_DISPUTE`, `RELEASED_TO_SELLER`, `REFUNDED_TO_BUYER`, `CANCELLED`. Es lo que devuelven backend y MSW. Los alias legacy en minúsculas (`paid`, `transfer_in_progress`, `released_to_seller`…) **se eliminaron** (issue #7): no vuelvas a añadirlos ni a duplicar guards may/min en los componentes (`confirm-action`, `transfer-actions`, `compra/[transactionId]`, `review-form`). `TimelineEventType` y `DorsalStatus` sí usan minúsculas legítimamente — no los confundas con `TransactionStatus`.

### Web app
- Server Components por defecto; `'use client'` solo para interactividad. SSR/SSG es crítico (SEO de marketplace).
- Route groups: `(marketing)` público SEO, `(app)` navegable/protegido, `(auth)` login/registro.
- Estilos: Tailwind + shadcn/ui (`components/ui/`), tokens vía CSS vars, theming con next-themes (`data-theme`).
- Nav responsive: el cluster de enlaces vive en `components/layout/nav.tsx` (`hidden md:flex`); en móvil (`md:hidden`) hay un menú hamburguesa en `nav-mobile.client.tsx` que abre el `Sheet` (`components/ui/sheet.tsx`, ahora con `SheetTitle`/`SheetDescription` para a11y). `ThemeToggle` queda visible en ambos.
- Forms: react-hook-form + zodResolver con los schemas de `packages/schemas`.
- `features/<dominio>/` agrupa hooks/componentes/server-fetchers por slice funcional.

## Modelo de ramas — trabajo en paralelo (ADR-012)

`feat/foundation` es la rama de integración long-lived (sale de `main`). Las tres ramas de features salen de foundation **en paralelo** y PR-ean **contra `feat/foundation`**:

- `feat/dorsales` — UC-02/04/05. Owns `app/(app)/{dorsales,vender}`, `features/dorsals`, `components/dorsal`.
- `feat/usuarios` — UC-01/09/10/11. Owns `app/(auth)`, `app/(app)/perfil`, `features/users`.
- `feat/transacciones` — UC-03/06/07/08. Owns `app/(app)/compra`, `features/transactions`, `components/transaction`.

Cada rama tiene un doc de onboarding en `docs/branches/feat-*.md` que lista archivos **owned** vs **shared**. Antes de tocar una zona compartida (`components/layout/nav.tsx`, `providers.tsx`, `api-client/src/http.ts`, `factory.ts`, `packages/domain/**`), coordina o hazlo en un PR aparte.

Los planes de implementación paso a paso están en `docs/superpowers/plans/2026-05-09-feat-*.md`.

## Convenciones

- Conventional Commits con scope = paquete/área: `feat(dorsals):`, `fix(api-client):`, `chore(web):`.
- TypeScript estricto con `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess` — cuidado con `undefined` en props opcionales y con accesos a índices de arrays.
- Tests: pirámide pragmática. Siempre dominio puro, schemas (casos válidos+inválidos), adapters HTTP. No se persigue cobertura alta porque sí.
- Para features no triviales: usar las skills de superpowers (`brainstorming` → `writing-plans` → `executing-plans`).

## Backend (repo paralelo)

FastAPI + SQLModel + PostgreSQL + Stripe Connect + S3 + Cognito, hexagonal. Contratos en `postman/dorsales-api.postman_collection.json` (Catalog), `postman/transaction_bounded_context.postman_collection.json` (Transaction) y `postman/identity_bounded_context.postman_collection.json` (Identity). Levantar en `http://localhost:8000` para trabajar contra módulos reales.
