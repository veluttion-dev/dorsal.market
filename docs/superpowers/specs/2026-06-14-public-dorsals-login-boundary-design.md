# Public Dorsals Login Boundary Design

## Goal

Los dorsales publicados deben poder verse sin iniciar sesion. La plataforma solo debe pedir login cuando una persona intente comprar un dorsal o entrar en un flujo privado.

## Current Behavior

`/dorsales` y `/dorsales/[id]` viven dentro del route group `(app)`, que comparte navegacion con sesion opcional. La proteccion real esta en `auth.config.ts`: `/vender`, `/perfil` y `/compra` requieren usuario. El listado y detalle de dorsales ya consumen Catalog desde Server Components y no necesitan datos privados para renderizar.

El problema de experiencia esta en el CTA de detalle. `BuyButton` usa `canBuyDorsal` con `userId: null`; eso deshabilita el boton con el texto "Inicia sesion para comprar". El usuario anonimo puede mirar el dorsal, pero no puede iniciar el intento de compra desde el CTA.

## Design

Mantener los dorsales como rutas publicas y mover la friccion de login al intento de compra:

- `/dorsales` y `/dorsales/[id]` siguen permitidos sin sesion.
- `/compra/**`, `/perfil/**` y `/vender/**` siguen protegidos por Auth.js.
- En el detalle de un dorsal publicado, un usuario anonimo ve un enlace activo "Comprar dorsal".
- Ese enlace apunta a `/login?callbackUrl=/compra/checkout/<dorsalId>`.
- Un usuario autenticado ve el enlace directo a `/compra/checkout/<dorsalId>`.
- Dorsales propios o no disponibles siguen mostrando el boton deshabilitado con su razon.

No se cambia el contrato de Catalog, Transaction ni Identity. Tampoco se exponen datos privados del vendedor: la pagina de detalle ya degrada el perfil publico si `GET /api/v1/users/{user_id}/public` falla.

## Components

- `apps/web/auth.config.ts`
  - Extraer un helper puro `isProtectedPath(pathname)` para hacer testeable la frontera publica/privada.
  - `authorized` mantiene el mismo comportamiento, pero usa ese helper.

- `apps/web/components/dorsal/buy-button.client.tsx`
  - Calcular primero si el dorsal esta disponible y si pertenece al usuario actual.
  - Si falta sesion y el dorsal esta publicado, renderizar un link al login con `callbackUrl`.
  - Si hay sesion y se puede comprar, renderizar el link directo al checkout.

## Testing

Unit tests:

- `BuyButton` anonimo renderiza un link a `/login?callbackUrl=%2Fcompra%2Fcheckout%2F...`.
- `BuyButton` autenticado renderiza un link directo a `/compra/checkout/...`.
- `isProtectedPath('/dorsales')` y `isProtectedPath('/dorsales/<id>')` devuelven `false`.
- `isProtectedPath('/compra/checkout/<id>')`, `/perfil` y `/vender` devuelven `true`.

Targeted verification:

- Ejecutar los tests nuevos.
- Ejecutar `pnpm --filter @dorsal/web test`.
- Ejecutar `pnpm --filter @dorsal/web typecheck`.

## Rollout

La rama `feat/dorsales` se sincroniza con `feat/foundation`, recibe esta modificacion y abre PR contra `feat/foundation`. El cambio es compatible con el flujo de transacciones porque `/compra/**` permanece protegido y `callbackUrl` devuelve al checkout tras el login.
