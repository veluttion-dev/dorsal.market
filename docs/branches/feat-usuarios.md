# feat/usuarios

**Goal:** Implementar el modulo Identity: Cognito login/session, perfil privado, perfil publico, validacion de datos de corredor para compra, historial consumido desde `feat/transacciones` y resenas MVP.

**Backend status:** Identity ya no debe tratarse como "pendiente".

- `../MVP-Dorsales` tiene `origin/feature/identity` con UC-01 Cognito/local user y migracion `users`.
- `origin/feature/UC-09-runner-profile` es la planificacion/implementacion mas reciente de perfil: `GET /api/v1/me`, `PATCH /api/v1/me`, `GET /api/v1/users/{user_id}/public`, `runner_data_complete`.
- Esa linea de Identity todavia debe reconciliarse con `origin/main`, que contiene Transaction, Catalog e infra AWS pre.
- Review sigue sin contrato estable para front; mantener MSW hasta que se integre el BC Review definitivo.

**AWS pre context:** API `https://qvdpnzcyzf.execute-api.eu-west-1.amazonaws.com`, Cognito pool `eu-west-1_lwL5qYgyF`, client `4qgmipgbv45f2roaju09bl0sk3`, Hosted UI domain `dorsales-pre`.

**Plan actualizado:** [`docs/superpowers/plans/2026-05-30-feat-usuarios-backend-sync.md`](../superpowers/plans/2026-05-30-feat-usuarios-backend-sync.md).

**Plan anterior:** [`docs/superpowers/plans/2026-05-09-feat-usuarios.md`](../superpowers/plans/2026-05-09-feat-usuarios.md) queda como referencia historica; no ejecutar sin aplicar el sync del 2026-05-30.

---

## Base Recomendada

`feat/usuarios` debe arrancar desde `feat/foundation` despues de mergear `feat/transacciones`.

Si hay que empezar antes, crear temporalmente desde `feat/transacciones` y rebasear a `feat/foundation` cuando transacciones este mergeada.

---

## Casos De Uso Cubiertos

### UC-01 - Registro e inicio de sesion

- Email + contrasena via Credentials provider de Auth.js.
- Google y Facebook opcionales: se renderizan solo si estan `CLIENT_ID` y `CLIENT_SECRET`.
- Registro pide: email, password, nombre completo, DNI, genero, fecha de nacimiento.
- En modo mocked, registro pasa `dev_user_id` a Credentials para que la sesion Auth.js coincida con el usuario creado por MSW.
- Tras registro: redireccion a `/perfil/completar`.

### UC-09 - Perfil y datos de corredor

Pagina con tres secciones:

1. **Identidad**: nombre editable; email, DNI, genero y fecha de nacimiento read-only.
2. **Contacto**: `phone_number`, direccion, ciudad, CP, pais.
3. **Datos de corredor para transferencia**: `whatsapp_number`, `t_shirt_size`, `estimated_time`, `medical_info`, `emergency_contact`.

Estos nombres estan alineados con `MVP-Dorsales`, donde Transaction lee:

```text
users.phone_number
users.dni
runner_profiles.whatsapp_number
runner_profiles.t_shirt_size
runner_profiles.estimated_time
runner_profiles.medical_info
runner_profiles.emergency_contact
```

### UC-10 - Historial

La pagina `/perfil/historial` ya fue creada en `feat/transacciones`.

Esta rama no debe crear `HistoryTabs` nuevo ni llamar a `api.transactions.listMine()`. Debe conservar el flujo actual:

```text
useMyPurchases()
useMySales()
```

### UC-11 - Resenas MVP

- Form rating 1-5 + comentario opcional.
- Visible en seguimiento de compra/venta cuando la transaccion este `confirmed` o `released_to_seller`.
- Backend Review aun no existe, asi que se mantiene MSW hasta que haya contrato real.

---

## Archivos Owned

```text
apps/web/app/(auth)/login/page.tsx
apps/web/app/(auth)/registro/page.tsx
apps/web/app/(app)/perfil/page.tsx
apps/web/app/(app)/perfil/completar/page.tsx
apps/web/features/users/**
apps/web/e2e/auth.spec.ts
apps/web/e2e/profile.spec.ts
packages/schemas/src/user.ts
packages/schemas/src/review.ts
packages/api-client/src/{ports,adapters,msw}/users*.ts
packages/api-client/src/{ports,adapters,msw}/reviews*.ts
```

## Zonas Compartidas

- `apps/web/lib/auth.ts`: necesario para el mock server-side de Credentials mientras Identity backend no exista.
- `apps/web/auth.config.ts`: solo si cambian rutas protegidas.
- `apps/web/features/transactions/components/buyer-data-notice.client.tsx`: quitar copy temporal y mostrar estado real de perfil.
- `apps/web/features/transactions/components/checkout-form.client.tsx`: bloquear checkout si el perfil no tiene `phone_number` y `t_shirt_size`.
- `apps/web/app/(app)/compra/[transactionId]/page.tsx`: insertar `ReviewForm`.
- `apps/web/app/(app)/perfil/historial/page.tsx`: solo verificar o enlazar, no reemplazar.

No meter un redirect global en `apps/web/app/(app)/layout.tsx` mientras `users` sea mockeado por navegador; ese layout corre server-side y no puede depender de MSW browser.

## Tareas Alto Nivel

- [ ] **Task 1** - Baseline contra `feat/foundation`, `origin/feature/UC-09-runner-profile` y AWS pre.
- [ ] **Task 2** - Rehacer schemas `users` al contrato plano `GET/PATCH /api/v1/me` + perfil publico.
- [ ] **Task 3** - Adaptar `UsersPort`/HTTP/MSW: `getMe`, `patchMe`, `getPublicProfile`; `login/register` solo mock/dev.
- [ ] **Task 4** - Configurar Auth.js Cognito/OIDC y conservar Credentials solo como fallback local.
- [ ] **Task 5** - Formularios `/perfil` y `/perfil/completar` con PATCH parcial.
- [ ] **Task 6** - Usar `profile_complete` y `runner_data_complete` en helpers/hooks.
- [ ] **Task 7** - Bloquear checkout cuando `runner_data_complete` sea false.
- [ ] **Task 8** - Preservar historial de `feat/transacciones` (`useMyPurchases`, `useMySales`).
- [ ] **Task 9** - Mantener Reviews en MSW hasta contrato back estable.
- [ ] **Task 10** - E2E auth/profile/checkout con modo Cognito pre y modo MSW local.
- [ ] **Task 11** - Pipeline verde + PR.

---

## Como Empezar

```bash
git switch feat/foundation
git pull
git switch -c feat/usuarios

# Si feat/transacciones aun no esta en foundation:
# git switch feat/transacciones
# git pull
# git switch -c feat/usuarios

# Para probar con back real cuando Identity este mergeado/desplegado:
#   NEXT_PUBLIC_API_BASE_URL=https://qvdpnzcyzf.execute-api.eu-west-1.amazonaws.com
#   NEXT_PUBLIC_REAL_API_MODULES=dorsals,transactions,users
#   Cognito Hosted UI/client configurado en Auth.js
#
# En local sin Identity real, NO anadas `users` ni `reviews`.

pnpm dev
# Seed user: demo@dorsal.market / demo1234
```

---

## Status

| Fecha | Estado |
|---|---|
| 2026-05-14 | Plan inicial listo, sin implementar. |
| 2026-05-24 | Plan actualizado tras `feat/transacciones` y revision de `MVP-Dorsales`; requiere mock server-side para Auth.js y reutiliza historial existente. |
| 2026-05-30 | Plan actualizado tras revisar ramas `MVP-Dorsales`: Identity/Cognito y UC-09 ya tienen contrato real en ramas remotas; `feat/usuarios` debe orientarse a `GET/PATCH /api/v1/me`, perfil publico y `runner_data_complete`. |
