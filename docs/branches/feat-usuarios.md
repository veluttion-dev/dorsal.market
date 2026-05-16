# feat/usuarios

**Goal:** Implementar el módulo Identity: registro, login (con Google y Facebook opcionales), perfil de corredor (identidad, contacto, datos deportivos), historial básico y reseñas cruzadas en formato mínimo.

**Backend status:** ⏳ **Mockeado vía MSW** (el módulo Identity del backend aún no está expuesto). El frontend trabaja contra `packages/api-client/src/msw/users.ts`, que persiste datos en `localStorage` durante la sesión de dev.

> Cuando el backend libere Identity, basta con: actualizar `packages/schemas/src/user.ts` al contrato real, añadir `users` a `NEXT_PUBLIC_REAL_API_MODULES`, y apagar el handler de MSW. El `UsersHttpAdapter` ya está implementado en foundation.

**Plan de implementación detallado:** [`docs/superpowers/plans/2026-05-09-feat-usuarios.md`](../superpowers/plans/2026-05-09-feat-usuarios.md) — 10 tasks.

---

## Casos de uso cubiertos

### UC-01 — Registro e inicio de sesión

- **Email + contraseña** vía Credentials provider de Auth.js (siempre disponible).
- **Google y Facebook** vía OAuth providers — solo se renderiza el botón si las env vars de OAuth están configuradas; si no, se ocultan automáticamente.
- Registro pide: email, password, nombre completo, DNI, género, fecha de nacimiento.
- Tras registro → redirección a `/perfil/completar` para completar contacto y datos de corredor.

### UC-09 — Perfil y datos de corredor

Página con tres secciones editables:
1. **Identidad** — nombre (editable), email/DNI/fecha nacimiento (read-only).
2. **Contacto y dirección** — teléfono, dirección, ciudad, CP, país.
3. **Datos de corredor** — tiempo estimado, talla camiseta, club, alergias.

Los datos del corredor se comparten automáticamente con el vendedor cuando completas una compra (ver `feat/transacciones`).

### UC-10 — Historial

Tabs "Compras" y "Ventas" con lista de transacciones. **Esta vista la consume**, no la genera — los datos vienen de `feat/transacciones` (`useMyPurchases`, `useMySales`). Coordinar con esa rama: la primera que abra PR crea la página, la otra solo enchufa los hooks.

### UC-11 — Reseñas (versión mínima MVP)

Form de rating 1-5 estrellas + comentario opcional. Visible tras completar transacción (`status = released_to_seller` o `confirmed`). El listado de reseñas de un seller aparecerá en su card del detalle de dorsal (cuando se implemente).

---

## Archivos que esta rama puede tocar libremente (owned)

```
apps/web/app/(auth)/login/page.tsx
apps/web/app/(auth)/registro/page.tsx
apps/web/app/(app)/perfil/page.tsx
apps/web/app/(app)/perfil/completar/page.tsx        # nuevo
apps/web/features/users/**
apps/web/components/user/**                          # nuevo, si hace falta
apps/web/e2e/auth.spec.ts
apps/web/e2e/profile.spec.ts
packages/schemas/src/user.ts                         # refinamientos
packages/schemas/src/review.ts                       # refinamientos
packages/api-client/src/{ports,adapters,msw}/users*.ts
packages/api-client/src/{ports,adapters,msw}/reviews*.ts
```

## Zonas compartidas (coordina antes de tocar)

- `apps/web/lib/auth.ts` y `apps/web/auth.config.ts` — auth scaffolding ya viene de foundation. Si necesitas añadir el `token` al JWT callback (por ejemplo, para que `feat/transacciones` lo lea), **acordadlo** y mejor hacerlo en un PR aparte `chore/auth-jwt-token`.
- `apps/web/proxy.ts` — el matcher ya existe. Si añades rutas protegidas nuevas, ajusta `authConfig.callbacks.authorized` en `auth.config.ts`.
- `apps/web/app/(app)/layout.tsx` — si añades el redirect a `/perfil/completar` cuando el perfil está incompleto, ese cambio es **compartido** (afecta a las tres ramas). Tu PR debe documentarlo y los demás se rebasan.
- `apps/web/app/(app)/perfil/historial/page.tsx` — la comparte con `feat/transacciones` (ver UC-10 arriba).
- `apps/web/components/layout/nav.tsx` — solo si quieres mostrar avatar/nombre del user logueado.
- `packages/domain/**` — funciones nuevas como `isProfileComplete(user)` van aquí si las usa más de una rama.

---

## Tareas (alto nivel)

- [ ] **Task 1** — Branch setup.
- [ ] **Task 2** — `<LoginForm />` + `<OAuthButtons />` — **UC-01 login**.
- [ ] **Task 3** — `<RegisterForm />` con DNI/género/fecha — **UC-01 registro**.
- [ ] **Task 4** — `useMe`, `useUpdateProfile`, `isProfileComplete()` (TDD del helper).
- [ ] **Task 5** — Página `/perfil` con tres form-sections — **UC-09**.
- [ ] **Task 6** — Profile completion guard + página `/perfil/completar`.
- [ ] **Task 7** — Página `/perfil/historial` con tabs — **UC-10** (coordinar con transacciones).
- [ ] **Task 8** — `<ReviewForm />` + `<ReviewList />` — **UC-11**.
- [ ] **Task 9** — E2E auth + profile.
- [ ] **Task 10** — Pipeline verde + abrir PR.

---

## Cómo empezar

```bash
git switch feat/foundation
git pull
git switch -c feat/usuarios

# En apps/web/.env.local NO añadas `users` a NEXT_PUBLIC_REAL_API_MODULES
# (déjalo solo con `dorsals` o como esté). MSW mockeará Identity.

pnpm dev
# Visita http://localhost:3000/login
# Seed user: demo@dorsal.market / demo1234
```

---

## Status

| Fecha | Estado |
|---|---|
| 2026-05-14 | Plan listo, sin implementar. MSW handlers de Identity ya en `feat/foundation`. |
