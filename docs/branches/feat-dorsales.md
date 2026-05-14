# feat/dorsales

**Goal:** Implementar el módulo Catalog: explorar dorsales en venta, ver el detalle, publicar uno nuevo. Es la primera experiencia "real" del usuario en el producto: lo que google indexa y lo que un comprador potencial recorre antes de logarse.

**Backend status:** ✅ **Vivo**. Endpoints en `http://localhost:8000`. Contrato en [`postman/dorsales-api.postman_collection.json`](../../postman/dorsales-api.postman_collection.json).

**Plan de implementación detallado:** [`docs/superpowers/plans/2026-05-09-feat-dorsales.md`](../superpowers/plans/2026-05-09-feat-dorsales.md) — 12 tasks.

---

## Casos de uso cubiertos

### UC-02 — Publicar dorsal

Formulario multi-sección con preview en vivo. Foto obligatoria. Campos: nombre carrera, número dorsal, fecha, ubicación, distancia, cajón salida, qué incluye (chip, camiseta, bolsa, medalla, avituallamientos), precio, métodos de pago, contacto (con flags de visibilidad), motivo venta.

- Endpoint: `POST /api/v1/dorsals` con `publish: true | false` (draft).
- Validación cliente/servidor desde el mismo `PublishDorsalInput` Zod schema.
- Foto sube vía mock presign (S3 real cuando el backend lo libere — el contrato ya está definido en `packages/api-client/src/ports/uploads.ts`).

### UC-04 — Explorar y filtrar

Listado paginado con filtros: nombre, distancia (chips multi-select), rango de precio, método de pago, ubicación, fechas, sort por precio/fecha. Filtros sincronizados con URL para compartir resultados.

- Endpoint: `GET /api/v1/dorsals?...`.
- Server Component renderiza la página 1 (SEO). Cliente toma el control para los filtros vía `nuqs`.

### UC-05 — Detalle del dorsal

Vista completa con foto grande, info de carrera, items incluidos, perfil del vendedor (rating, ventas previas), métodos de pago aceptados, CTA "Comprar dorsal" (que en `feat/transacciones` enchufa el flujo de pago).

- Endpoint: `GET /api/v1/dorsals/{id}`.
- Server Component con `revalidate = 300` (ISR cada 5 min) y `generateMetadata` para Open Graph cards (importante para compartir en redes).

---

## Archivos que esta rama puede tocar libremente (owned)

```
apps/web/app/(app)/dorsales/page.tsx
apps/web/app/(app)/dorsales/[id]/page.tsx
apps/web/app/(app)/vender/page.tsx
apps/web/features/dorsals/**
apps/web/components/dorsal/**
apps/web/e2e/dorsals-*.spec.ts
packages/schemas/src/dorsal.ts                # refinamientos del schema
packages/api-client/src/{ports,adapters,msw}/dorsals*.ts
packages/api-client/src/adapters/uploads-mock.ts
packages/api-client/src/ports/uploads.ts
```

## Zonas compartidas (coordina antes de tocar)

- `apps/web/components/layout/nav.tsx` → si necesitas marcar el link "Dorsales" como activo (mejor en un PR aparte `chore/nav-active-links`).
- `apps/web/app/(app)/dorsales/[id]/page.tsx` → **`feat/transacciones` quiere insertar el `<BuyButton />`** ahí (ver Task 6 de transacciones). Acordad quién pone qué y en qué orden mergea.
- `packages/api-client/src/http.ts` → si descubres que el header `X-User-Id` necesita cambiar para algún endpoint de Catalog, **avisa**. Ese fichero lo tocamos coordinadamente.
- `packages/domain/**` → si añades helpers (ej. `parseDorsalFilters`), confirma que no chocan con otras ramas.

---

## Tareas (alto nivel)

Detalle paso a paso en el plan; aquí solo el resumen para tracking:

- [ ] **Task 1** — Branch setup + deps (`react-dropzone`, `nuqs`, shadcn `checkbox`, `slider`, `calendar`).
- [ ] **Task 2** — Filtros ↔ URL parser/serializer (TDD).
- [ ] **Task 3** — Distance label helper (TDD).
- [ ] **Task 4** — `<DorsalCard />` presentacional + payment pills.
- [ ] **Task 5** — `<DorsalGrid />`.
- [ ] **Task 6** — Filter sidebar (Client Component, nuqs).
- [ ] **Task 7** — Página `/dorsales` (Server Component + Client filtros) — **UC-04**.
- [ ] **Task 8** — Página `/dorsales/[id]` con ISR + OG metadata — **UC-05**.
- [ ] **Task 9** — `<PhotoUpload />` con presign mock.
- [ ] **Task 10** — Página `/vender` con `<PublishWizard />` — **UC-02**.
- [ ] **Task 11** — E2E happy paths (search + publish).
- [ ] **Task 12** — Pipeline verde + abrir PR.

---

## Cómo empezar

```bash
git switch feat/foundation
git pull
git switch -c feat/dorsales

# Levanta el backend Catalog en localhost:8000 (repo paralelo)
# En apps/web/.env.local asegúrate:
#   NEXT_PUBLIC_REAL_API_MODULES=dorsals

pnpm dev
# Visita http://localhost:3000/dorsales
```

Sigue las tasks del plan en orden. Cada task tiene su propio commit.

---

## Status

| Fecha | Estado |
|---|---|
| 2026-05-14 | Plan listo, sin implementar. Schemas y adapter HTTP de Dorsals ya en `feat/foundation`. |

Actualiza esta tabla conforme avances o cuando hagas merge.
