# dorsal.market

Marketplace de **dorsales de carreras populares** con pago en custodia (escrow). Vendedores publican dorsales que no pueden usar; compradores pagan vía Stripe; el dinero se libera cuando ambos confirman el cambio de titularidad. Modelo BlaBlaCar, dominio "running".

> Estado: en desarrollo activo. Web prioritario (Next.js); móvil llegará después con Expo. Backend FastAPI hexagonal en repositorio paralelo.

---

## Tabla de contenidos

- [Tech stack](#tech-stack)
- [Estructura del repo](#estructura-del-repo)
- [Quickstart](#quickstart)
- [Modelo de trabajo (varios devs en paralelo)](#modelo-de-trabajo-varios-devs-en-paralelo)
- [Documentación](#documentación)
- [Comandos útiles](#comandos-útiles)
- [Backend en repo paralelo](#backend-en-repo-paralelo)
- [Convenciones](#convenciones)

---

## Tech stack

| Capa | Tecnología | Por qué |
|---|---|---|
| **Monorepo** | pnpm workspaces + Turborepo | `node_modules` minimalista, cache de build/test por paquete |
| **Lenguaje** | TypeScript 5.6 estricto (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) | Tipado serio en límites entre módulos |
| **Runtime** | Node 20 LTS | Definido en `.nvmrc` y `package.json#engines` |
| **Web framework** | Next.js 15 (App Router, Server Components) | SSR/SSG real → SEO crítico para un marketplace |
| **Estilos** | Tailwind CSS + shadcn/ui + CSS vars | Tokens del mockup mapeados a Tailwind theme; primitivos accesibles (Radix) |
| **Theming** | next-themes (atributo `data-theme`) | Dark/light sin flash en SSR |
| **Auth** | Auth.js v5 (Credentials + Google + Facebook) | Sesión por cookie HTTP-only firmada (mejor que localStorage) |
| **Estado servidor** | TanStack Query v5 | Caché, dedup, optimistic updates, paginación |
| **Estado cliente (puntual)** | Zustand con `persist` | Para UI persistente entre sesiones (filtros, theme) |
| **Forms** | react-hook-form + Zod | Validación cliente/servidor compartida desde el mismo schema |
| **Mocks API** | MSW v2 (Mock Service Worker) | Intercepta `fetch` para los módulos del backend que aún no están vivos |
| **Pagos** | Stripe Connect + Stripe Elements | Escrow real, test mode en dev |
| **Tests unit/integration** | Vitest + Testing Library + happy-dom | Rápido, ES modules nativo |
| **Tests E2E** | Playwright | Chrome en CI, headed local |
| **Lint/format** | Biome 1.9 | Un solo binario, ~10× más rápido que ESLint+Prettier |
| **Iconos** | lucide-react | Tree-shakeable, los que shadcn adopta |
| **CI** | GitHub Actions + Turborepo cache | Tareas afectadas por cada cambio se ejecutan solas |
| **Deploy web** | Vercel (production + PR previews) | Pendiente conectar |
| **Observabilidad** | Sentry (errores) + Vercel Analytics (Web Vitals) | DSN vacío en dev = no envía |
| **Móvil (futuro)** | Expo + React Native, FlashList, MMKV, Reanimated, expo-sqlite | Plan, no implementado todavía |

Cualquier decisión arquitectónica está documentada como ADR en [`docs/superpowers/specs/2026-05-09-frontend-architecture-design.md`](docs/superpowers/specs/2026-05-09-frontend-architecture-design.md).

---

## Estructura del repo

```
dorsal.market/
├── apps/
│   ├── web/                          # Next.js 15 — la app web (prioritaria)
│   └── mobile/                       # Expo (placeholder; se implementará después)
├── packages/
│   ├── api-client/                   # Cliente HTTP + puertos + adapters (HTTP/Mock) + MSW + TanStack Query provider
│   ├── domain/                       # Lógica pura sin I/O (canBuyDorsal, formatPrice, timeline)
│   ├── schemas/                      # Zod schemas: dorsal, user, transaction, review, common
│   ├── ui-tokens/                    # Design tokens (colores, radii, fuentes) consumidos por Tailwind
│   └── tsconfig/                     # Configs TS base (base.json, nextjs.json, react-native.json, library.json)
├── docs/
│   ├── superpowers/
│   │   ├── specs/                    # Specs de arquitectura y features
│   │   └── plans/                    # Planes de implementación por rama
│   └── branches/                     # Onboarding por rama: UCs, tasks, archivos, status
├── mockups/                          # 6 HTML de referencia (diseño visual)
├── .github/workflows/ci.yml          # Pipeline CI
├── biome.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Quickstart

**Prerrequisitos:** Node 20 (`nvm use`), pnpm 9 (`corepack enable && corepack prepare pnpm@9.12.0 --activate`).

```bash
# 1. Instala dependencias
pnpm install

# 2. Configura variables de entorno de la web
cp .env.example apps/web/.env.local
# Edita NEXTAUTH_SECRET (genera uno con `openssl rand -base64 32`)

# 3. Arranca la web (con MSW activo para los módulos mockeados)
pnpm dev
```

Web app: <http://localhost:3000>.

Para conectar **módulos reales** del backend, edita `NEXT_PUBLIC_REAL_API_MODULES` en `apps/web/.env.local`:

```env
# CSV de módulos contra backend real. El resto se mockea con MSW en dev.
NEXT_PUBLIC_REAL_API_MODULES=dorsals,transactions
```

Y levanta el backend en `http://localhost:8000` (ver [Backend en repo paralelo](#backend-en-repo-paralelo)).

---

## Modelo de trabajo (varios devs en paralelo)

El proyecto está diseñado para que **varios desarrolladores trabajen sin pisarse**. Tras la rama `feat/foundation` (que entrega el scaffolding compartido), las tres ramas de features salen **en paralelo** desde `feat/foundation`:

```
main
 └── feat/react-native-development          (rama base, integración)
      └── feat/foundation                   PR #1 — ya mergeable
           ├── feat/dorsales                ─┐
           ├── feat/usuarios                ─┼─ EN PARALELO
           └── feat/transacciones           ─┘
```

Cada rama es **dueña** de un slice del codebase. Si todos respetamos esa ownership, los PRs se mergean sin conflicto:

| Rama | UCs | Backend status | Slice (cambia libremente) |
|---|---|---|---|
| [`feat/dorsales`](docs/branches/feat-dorsales.md) | UC-02, UC-04, UC-05 | ✅ Catalog vivo | `apps/web/app/(app)/{dorsales,vender}/**`, `apps/web/features/dorsals/**`, `apps/web/components/dorsal/**` |
| [`feat/usuarios`](docs/branches/feat-usuarios.md) | UC-01, UC-09, UC-10, UC-11 | ⏳ Identity mockeado (MSW) | `apps/web/app/(auth)/**`, `apps/web/app/(app)/perfil/**`, `apps/web/features/users/**` |
| [`feat/transacciones`](docs/branches/feat-transacciones.md) | UC-03, UC-06, UC-07, UC-08 | ✅ Transaction vivo | `apps/web/app/(app)/compra/**`, `apps/web/features/transactions/**`, `apps/web/components/transaction/**` |

**Zonas compartidas que requieren coordinación** (toque con comunicación previa, idealmente en un PR aparte):
- `apps/web/components/layout/nav.tsx`
- `apps/web/components/providers.tsx`
- `packages/api-client/src/http.ts`, `factory.ts`
- `packages/domain/**`

Detalles completos por rama en [`docs/branches/`](docs/branches/). Modelo arquitectónico en [ADR-012](docs/superpowers/specs/2026-05-09-frontend-architecture-design.md#adr-012--modelo-de-ramas-paralelas-partiendo-de-featfoundation).

---

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/superpowers/specs/2026-05-09-frontend-architecture-design.md`](docs/superpowers/specs/2026-05-09-frontend-architecture-design.md) | **Arquitectura completa**: 16 ADRs con decisión + alternativas + por qué + cuándo reconsiderar |
| [`docs/superpowers/plans/2026-05-09-feat-foundation.md`](docs/superpowers/plans/2026-05-09-feat-foundation.md) | Plan de implementación de la rama foundation (ya ejecutado) |
| [`docs/superpowers/plans/2026-05-09-feat-dorsales.md`](docs/superpowers/plans/2026-05-09-feat-dorsales.md) | Plan de implementación de feat/dorsales (12 tasks) |
| [`docs/superpowers/plans/2026-05-09-feat-usuarios.md`](docs/superpowers/plans/2026-05-09-feat-usuarios.md) | Plan de implementación de feat/usuarios (10 tasks) |
| [`docs/superpowers/plans/2026-05-09-feat-transacciones.md`](docs/superpowers/plans/2026-05-09-feat-transacciones.md) | Plan de implementación de feat/transacciones (13 tasks, contra backend real) |
| [`docs/branches/feat-*.md`](docs/branches/) | Doc de onboarding por rama: UCs, archivos owned/shared, checklist |
| [`mockups/*.html`](mockups/) | Diseño visual de las 6 pantallas (referencia, no se modifica) |
| [`postman/dorsales-api.postman_collection.json`](postman/dorsales-api.postman_collection.json) | Contrato del backend Catalog |
| [`postman/transaction_bounded_context.postman_collection.json`](postman/transaction_bounded_context.postman_collection.json) | Contrato del backend Transaction |

---

## Comandos útiles

```bash
# Dev
pnpm dev                                          # arranca apps/web en :3000

# Lint + format
pnpm format                                       # auto-formatea con Biome
pnpm format:check                                 # CI: verifica formato
pnpm turbo run lint                               # lint en todos los paquetes

# Typecheck + tests
pnpm turbo run typecheck                          # tsc --noEmit en todo el monorepo
pnpm turbo run test                               # vitest run en todos los paquetes
pnpm --filter @dorsal/schemas test                # solo un paquete

# Build
pnpm turbo run build                              # next build + tsc emit donde aplique

# E2E
pnpm --filter @dorsal/web test:e2e                # Playwright (requiere navegadores instalados)

# Todo a la vez (lo que corre el CI)
pnpm turbo run lint typecheck test build
```

---

## Backend en repo paralelo

El backend es **un repo separado**, FastAPI + SQLModel + opyoid (DI) + PostgreSQL + Stripe Connect + S3, con arquitectura hexagonal.

**Estado de los bounded contexts a 2026-05-14:**

| Módulo | Estado | Auth | Contrato Postman |
|---|---|---|---|
| **Catalog** (dorsales) | ✅ vivo | `X-User-Id` provisional | `postman/dorsales-api.postman_collection.json` |
| **Transaction** (compra/escrow/disputas) | ✅ vivo | `Authorization: Bearer <JWT>` | `postman/transaction_bounded_context.postman_collection.json` |
| **Identity** (auth, perfil) | ⏳ pendiente | — | (frontend mockea con MSW) |
| **Review** (reseñas) | ⏳ pendiente | — | (frontend mockea con MSW) |

Cuando el backend libere Identity o Review:
1. Actualiza los Zod schemas correspondientes para reflejar el contrato real.
2. Cambia `NEXT_PUBLIC_REAL_API_MODULES` para incluir el módulo nuevo.
3. Apaga el handler de MSW de ese módulo.

El HTTP client del frontend inyecta tanto `X-User-Id` como `Authorization: Bearer` cuando hay sesión, así cada módulo del backend usa el header que corresponda durante la transición.

---

## Convenciones

- **Branches**: `feat/<nombre>` para features, `fix/<nombre>` para bugs, `chore/<nombre>` para tooling, `docs/<nombre>` para docs sueltas. Salen de `feat/react-native-development` (la rama base de integración).
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(scope): mensaje`, `fix(scope): mensaje`. Scope = paquete o área (`web`, `api-client`, `schemas`, `dorsals`, `users`, `transactions`, ...).
- **PRs**: contra `feat/react-native-development`. Squash merge. Descripción incluye: UCs cubiertos, screenshots (si es UI), checklist de test.
- **Tests**: pirámide pragmática. Siempre: dominio puro, schemas (válidos+inválidos), adapters HTTP. Casi siempre: hooks de mutación con invalidación. E2E: 4-6 happy paths.
- **Skills de superpowers**: para features no triviales, invocar `superpowers:brainstorming` antes de codear, luego `superpowers:writing-plans` para el plan, y `superpowers:executing-plans` (o subagent-driven) para ejecutar.

---

## Licencia

Privado, sin licencia pública. Confidencial.
