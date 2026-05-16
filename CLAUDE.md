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

- **Node 20 es obligatorio** (`.nvmrc`). Si la shell por defecto trae Node 18, los comandos de build fallan. Activa con `nvm use` o prefija: `export PATH="$HOME/.nvm/versions/node/v20.*/bin:$PATH"`.
- **pnpm 9.12.0** vía corepack.
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

La env var `NEXT_PUBLIC_REAL_API_MODULES` (CSV) decide qué módulos van contra el backend real; el resto los mockea MSW en dev. Estado backend: Catalog y Transaction **vivos**; Identity y Review **mockeados**.

Los componentes **nunca llaman `fetch`** — solo usan hooks de TanStack Query que envuelven los puertos. Migrar de mock a real es cambiar la env var, sin tocar UI.

### Auth
Auth.js v5 (`apps/web/lib/auth.ts`, `auth.config.ts`). El HTTP client (`packages/api-client/src/http.ts`) inyecta el header de auth: Catalog usa `X-User-Id` provisional, Transaction usa `Authorization: Bearer <JWT>`. Ambos coexisten durante la migración del backend.

### Web app
- Server Components por defecto; `'use client'` solo para interactividad. SSR/SSG es crítico (SEO de marketplace).
- Route groups: `(marketing)` público SEO, `(app)` navegable/protegido, `(auth)` login/registro.
- Estilos: Tailwind + shadcn/ui (`components/ui/`), tokens vía CSS vars, theming con next-themes (`data-theme`).
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

FastAPI + SQLModel + PostgreSQL + Stripe Connect + S3, hexagonal. Contratos en `postman/dorsales-api.postman_collection.json` (Catalog) y `postman/transaction_bounded_context.postman_collection.json` (Transaction). Levantar en `http://localhost:8000` para trabajar contra módulos reales.
