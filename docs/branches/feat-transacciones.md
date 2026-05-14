# feat/transacciones

**Goal:** Implementar el módulo Transaction: onboarding del vendedor con Stripe Connect, reserva con PaymentIntent, vistas separadas buyer/seller del estado de la compra, flujo de prueba de transferencia (cambio de titularidad del dorsal), disputas, y "seller problem reports" para soporte post-resolución.

**Backend status:** ✅ **Vivo** desde 2026-05-14. Endpoints en `http://localhost:8000`. Contrato en [`postman/transaction_bounded_context.postman_collection.json`](../../postman/transaction_bounded_context.postman_collection.json).

**Plan de implementación detallado:** [`docs/superpowers/plans/2026-05-09-feat-transacciones.md`](../superpowers/plans/2026-05-09-feat-transacciones.md) — 13 tasks.

> Esta rama **rehace** los schemas/port/adapter/mock de Transaction que vinieron con foundation, porque el contrato real del backend difiere del que se asumió cuando se escribió el plan original. La task 2 y 3 del plan cubren esa actualización.

---

## Casos de uso cubiertos

### UC-03 — Pasarela de pago (escrow) + disputas

- **Onboarding del vendedor** (`POST /api/v1/sellers/onboard`) — prerequisito antes de poder vender. Lanza el flujo de Stripe Connect.
- **Disputas** (`POST /api/v1/transactions/{id}/dispute`) — el comprador puede abrir una disputa si el cambio de titularidad no se completa. La resolución la maneja un admin (fuera de scope MVP del frontend).
- **Seller problem reports** (`POST /api/v1/transactions/{id}/seller-problem-reports`) — soporte post-resolución para el vendedor (race rechazó el cambio, problema de payout, etc.). Categorías: `buyer_data_issue`, `race_rejected_transfer`, `payment_or_payout_issue`, `other`. Multipart con archivos opcionales.

### UC-06 — Compra de dorsal

Flujo:
1. Comprador pulsa "Comprar dorsal" en `/dorsales/[id]`.
2. Frontend llama `POST /api/v1/transactions` con `{dorsal_id, buyer_id}`.
3. Backend devuelve `transaction_id` + `client_secret` del Stripe PaymentIntent.
4. Frontend monta `<Elements>` con el `clientSecret` y `<PaymentElement />` para la tarjeta.
5. Stripe confirma el pago → backend recibe webhook `payment_intent.succeeded` y avanza el estado.
6. Redirect a `/compra/confirmada?tx=<id>`.

En dev sin clave de Stripe (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` vacío), la UI muestra un botón "Simular pago" que avanza el mock directamente.

### UC-07/08 — Seguimiento post-venta + soporte

Página `/compra/[transactionId]` con:
- **Timeline de eventos** (no un avance lineal, sino una lista de eventos tipados): `reservation_created`, `payment_succeeded`, `transfer_in_progress`, `proof_submitted`, `transfer_confirmed`, `funds_released`, `dispute_opened`, etc.
- **Vista rol-aware**:
  - Comprador (`GET /api/v1/transactions/buyer/{id}`) → ve el estado, datos del vendedor, botón "Confirmar cambio", botón "Abrir disputa".
  - Vendedor (`GET /api/v1/transactions/seller/{id}`) → ve los datos del comprador (nombre, DNI, email, etc.) para hacer el cambio, botón "Marcar cambio iniciado", uploader de prueba de transferencia (PDF/imagen).
- **Polling** vía `useQuery` con `refetchInterval: 10_000` para reflejar cambios sin recargar.

---

## Archivos que esta rama puede tocar libremente (owned)

```
apps/web/app/(app)/compra/checkout/[dorsalId]/page.tsx
apps/web/app/(app)/compra/confirmada/page.tsx
apps/web/app/(app)/compra/[transactionId]/page.tsx
apps/web/app/(app)/vender/onboarding/page.tsx       # nuevo
apps/web/features/transactions/**
apps/web/components/transaction/**
apps/web/components/dorsal/buy-button.client.tsx    # solo este file; el resto de /components/dorsal/ es de feat/dorsales
apps/web/e2e/purchase.spec.ts
packages/schemas/src/transaction.ts                  # REWRITE completo
packages/api-client/src/{ports,adapters,msw}/transactions*.ts
sentry.{client,server,edge}.config.ts                # nuevos
```

## Zonas compartidas (coordina antes de tocar)

- `apps/web/app/(app)/dorsales/[id]/page.tsx` → **necesitas insertar el `<BuyButton />` aquí**. Es archivo owned por `feat/dorsales`. Coordinad:
  - Opción A: `feat/dorsales` mergea primero, tú haces rebase y añades el BuyButton.
  - Opción B: si `feat/dorsales` aún no ha tocado esa página (placeholder de foundation), tú la editas y luego coordinas con el dev de Dorsales para resolver el merge.
- `apps/web/app/(app)/perfil/historial/page.tsx` → compartida con `feat/usuarios`. Quien abra el PR primero crea la página entera; el segundo solo añade hooks o columnas.
- `packages/api-client/src/http.ts` → necesitas que envíe `Authorization: Bearer <jwt>` además del `X-User-Id`. Lo modifica esta rama en Task 3 step 1 del plan. Si `feat/usuarios` también lo está tocando para auth, sincronizad.
- `apps/web/auth.config.ts` y `apps/web/lib/auth.ts` → si necesitas exponer el `token` del JWT en la sesión, lo tocas aquí. Mejor abrir un PR `chore/auth-token-in-session` si la app no lo tiene aún.
- `apps/web/components/providers.tsx` → añade `<Elements>` solo si lo necesitas a nivel global; por defecto va por página.
- `packages/api-client/src/factory.ts` → si el adapter Transaction necesita `baseUrl` como argumento adicional, lo modificas.

---

## Tareas (alto nivel)

- [ ] **Task 1** — Branch setup + Stripe + Sentry deps.
- [ ] **Task 2** — **Reescribir** `packages/schemas/src/transaction.ts` al contrato real del backend (TDD).
- [ ] **Task 3** — Actualizar HTTP adapter, port y mock MSW; ampliar HTTP client con `Authorization: Bearer`.
- [ ] **Task 4** — Hooks TanStack Query (onboard, reserve, buyer/seller getters, transfer-in-progress, submit-proof, confirm, dispute, seller-problem-report, my-purchases, my-sales).
- [ ] **Task 5** — Página `/vender/onboarding` con Stripe Connect — **UC-03 prerequisito**.
- [ ] **Task 6** — `<BuyButton />` en detalle + página `/compra/checkout/[dorsalId]` con Stripe Elements — **UC-06**.
- [ ] **Task 7** — Página `/compra/confirmada`.
- [ ] **Task 8** — Página `/compra/[transactionId]` rol-aware con timeline + acciones — **UC-07/08**.
- [ ] **Task 9** — `<DisputeDialog />` — **UC-03 buyer**.
- [ ] **Task 10** — `<SellerProblemReport />` post-final.
- [ ] **Task 11** — Wire hooks en `/perfil/historial` — **UC-10** (coordinar con usuarios).
- [ ] **Task 12** — E2E happy path purchase.
- [ ] **Task 13** — Pipeline verde + abrir PR.

---

## Cómo empezar

```bash
git switch feat/foundation
git pull
git switch -c feat/transacciones

# Levanta el backend Transaction en localhost:8000.
# En apps/web/.env.local:
#   NEXT_PUBLIC_REAL_API_MODULES=dorsals,transactions
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...        # opcional; sin clave, modo mock
#   STRIPE_SECRET_KEY=sk_test_...                         # opcional; lo usa el backend

pnpm dev
# Visita http://localhost:3000/dorsales, elige un dorsal, "Comprar"
```

---

## Status

| Fecha | Estado |
|---|---|
| 2026-05-14 | Plan reescrito tras publicación de la Postman collection del backend. Sin implementar. |
