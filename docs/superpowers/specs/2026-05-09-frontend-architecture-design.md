# Diseño de arquitectura — Frontend dorsal-market

- **Fecha:** 2026-05-09
- **Estado:** Aprobado (brainstorming) — pendiente plan de implementación
- **Autor:** Alejandro + Claude (sesión brainstorming superpowers)
- **Audiencia:** equipo de desarrollo (presente y futuro)

> Este documento es la fuente de verdad de las decisiones arquitectónicas
> tomadas para el frontend de **dorsal-market**. Para cada decisión se registra
> qué se eligió, qué alternativas se descartaron y **por qué**, de forma que
> quien se incorpore al proyecto pueda evaluar si una decisión sigue siendo
> válida en lugar de heredarla a ciegas.

---

## 1. Contexto

**Producto.** Dorsal-market es un marketplace de dorsales de carreras populares con pago en custodia (escrow), modelo BlaBlaCar. Los corredores que no pueden asistir publican su dorsal; los compradores pagan vía Stripe; el dinero se libera cuando ambos confirman el cambio de titularidad.

**Estado de partida del repositorio.**
- Rama de integración: `feat/foundation` (a partir de `main`). Hasta el 2026-05-14 existió una rama intermedia `feat/react-native-development` que se eliminó al confirmar el stack Next.js+Expo monorepo: foundation pasa a ser directamente la rama "next" sobre la que se mergean las features.
- Existen 6 mockups HTML en la raíz (`index`, `dorsales`, `dorsal-detalle`, `vender-dorsal`, `compra-confirmada`, `perfil`) con paleta coral (#e8552d) + oliva (#6dab5e/#c8f542), tipografías Outfit + Space Mono, modo dark/light vía `data-theme`.
- No hay código de aplicación todavía — los mockups son solo referencia visual.

**Backend en repositorio paralelo.** Stack: Python 3.12 + FastAPI + SQLModel + opyoid (DI) + PostgreSQL + Stripe Connect + S3, arquitectura **hexagonal (Ports & Adapters)**. Estado actualizado a 2026-05-14:

| Bounded context | Estado backend | Auth | Postman ref |
|---|---|---|---|
| **Catalog** (UC-02, UC-04, UC-05) | ✅ vivo | header `X-User-Id` | `postman/dorsales-api.postman_collection.json` |
| **Transaction** (UC-03, UC-06, UC-07, UC-08) | ✅ vivo | header `Authorization: Bearer <JWT>` | `postman/transaction_bounded_context.postman_collection.json` |
| **Identity** (UC-01, UC-09) | ⏳ pendiente — frontend usa mock MSW | — | — |
| **Review** (UC-11) | ⏳ pendiente — frontend usa mock MSW | — | — |

**Auth.** El backend está migrando hacia JWT. Catalog aún acepta `X-User-Id` provisional; Transaction ya exige `Authorization: Bearer <jwt>`. La capa HTTP del frontend (ADR-005) inyecta ambos headers a la vez mientras dure la transición — el backend acepta el que corresponda a su módulo y descarta el otro.

**Casos de uso del backend (README).** UC-01 a UC-11. Resumidos por módulo:
- **Identity:** UC-01 registro/login (email + Google + Facebook, con DNI/género/edad), UC-09 perfil corredor, UC-10 historial, UC-11 reseñas cruzadas.
- **Catalog:** UC-02 publicar (fotos obligatorias), UC-04 explorar/filtrar, UC-05 detalle.
- **Transaction:** UC-03 escrow + disputas, UC-06 compra, UC-07/08 timeline post-venta de 5 pasos con chat soporte.

---

## 2. Objetivos y restricciones

| Objetivo | Implicación |
|---|---|
| **Web es prioritario** (MVP), móvil llega después si valida | SSR/SSG real, SEO crítico, no React Native Web |
| **Marketplace** → cada listing/detalle debe ser indexable y compartible (OG cards) | Server Components, ISR para detalles, OG metadata por página |
| **Avanzar las 3 ramas en paralelo o secuencial sin esperar al backend** | Capa de cliente API con adapter mockeable |
| **Cuando el backend exponga endpoints reales, swap sin tocar UI** | Patrón puerto + adapter, mismo contrato Zod |
| **MVP funcional end-to-end** (6 pantallas + auth básica) en esta primera tanda | Reseñas, historial completo y disputas avanzadas son follow-up |
| **Móvil se hará después con Expo** sin rehacer dominio ni cliente API | Lógica compartible vía paquetes; UI por plataforma |

**No-objetivos** (explícitos para evitar deriva):
- No buscamos código UI compartido web↔móvil.
- No hacemos PWA en el MVP.
- No internacionalizamos (i18n) en el MVP — solo español.
- No implementamos UC-11 (reseñas) ni UC-10 (historial detallado) ni UC-03 (disputas) en la primera tanda.
- No probamos al 100% de cobertura — pirámide pragmática.

---

## 3. Decisiones arquitectónicas (ADR)

Cada decisión sigue el formato:
- **Qué se decidió**
- **Alternativas evaluadas**
- **Por qué se eligió esta**
- **Consecuencias / cuándo reconsiderar**

### ADR-001 — Stack dual web + móvil en monorepo (no React Native Web)

**Decidido.** Next.js 15 (App Router, TypeScript) para web en `apps/web`. Expo (React Native) para móvil en `apps/mobile`, scaffolded inicialmente vacío y desarrollado en una fase posterior. Compartimos paquetes en `packages/`.

**Alternativas evaluadas.**
1. **Expo + React Native Web como única base.** Habría dado un solo codebase para web y móvil.
2. **Tamagui + Solito** (universal stack).

**Por qué.** El producto es un marketplace cuyo crecimiento depende de búsqueda orgánica (gente buscando "dorsal Maratón Valencia"). React Native Web no ofrece SSR/SSG real, mete ~200KB de runtime adicional, y FlashList/MMKV/SQLite/Reanimated tienen soporte web parcial o necesitan polyfills. SEO + Core Web Vitals + simplicidad de stack web pesan más que la economía de un solo codebase. Tamagui es excelente pero su ecosistema y curva de aprendizaje no compensan cuando ya tenemos los mockups guiando el diseño web.

**Consecuencias.**
- Habrá dos UIs (web y, eventualmente, móvil). Aceptado.
- La capa de dominio, schemas, cliente API y reglas de negocio **sí** se comparten.
- Las dependencias originalmente pedidas para móvil (FlashList, react-native-mmkv, expo-sqlite, Reanimated, Gesture Handler) **se usarán solo en `apps/mobile`** cuando llegue su fase. En web usamos sus equivalentes idiomáticos (TanStack Virtual si hace falta virtualizar listas, localStorage / IndexedDB, Framer Motion).

**Cuándo reconsiderar.** Si el producto pivota a "móvil primero" o el SEO deja de ser estratégico (p.ej. tráfico viene 100% de redes sociales con deep links a la app).

---

### ADR-002 — Monorepo con pnpm workspaces + Turborepo

**Decidido.** pnpm workspaces para gestión de dependencias, Turborepo para orquestación de tareas (build, lint, test, typecheck) con cache.

**Alternativas evaluadas.**
1. **Nx** — más opinionado, mejor para grandes monorepos, generadores potentes.
2. **Yarn workspaces (classic)** — funciona, ecosistema antiguo.
3. **Bun workspaces** — rápido pero ecosistema aún maduro.

**Por qué.** pnpm es la opción más rápida e instalable hoy, con `node_modules` minimalista (symlinks). Turborepo es ligero, focalizado en cache + paralelización, y tiene integración nativa con Vercel. Nx es más potente pero la curva de aprendizaje y la capa de generadores no aportan a la escala de este proyecto. Bun aún no está donde está pnpm en estabilidad de ecosistema.

**Consecuencias.** CI usa `pnpm install --frozen-lockfile` y `pnpm turbo run <task>`. Cache local (`.turbo/`) y remota (Vercel) reducen tiempo de CI a segundos en cambios pequeños.

---

### ADR-003 — Tooling: TypeScript estricto, Biome, Node 20 LTS

**Decidido.**
- TypeScript 5.6+ con `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Biome** como formateador y linter (un solo binario, rápido).
- Node 20 LTS.

**Alternativas evaluadas.**
1. **ESLint + Prettier** — el clásico, ecosistema más grande.
2. **dprint + ESLint** — combinación muy rápida pero menos integrada.

**Por qué.** Biome unifica format+lint en un binario rust de orden de magnitud más rápido. Para este tamaño de proyecto cubre 90% de las reglas que importan. Si en el futuro hace falta una regla muy específica de ESLint, se puede migrar — Biome no nos encierra.

**Consecuencias.** `eslint-plugin-jsx-a11y` se mantiene aparte (Biome no lo cubre todavía) — se ejecuta en pre-commit y CI específicamente para accesibilidad.

---

### ADR-004 — Capa "Mock layer intercambiable" estilo puertos hexagonales

**Decidido.** En `packages/api-client` definimos puertos (interfaces TypeScript) por módulo del backend (`DorsalsPort`, `UsersPort`, `TransactionsPort`, `ReviewsPort`). Para cada puerto hay dos implementaciones:
- **HTTP adapter** que llama al backend real.
- **Mock adapter** que devuelve datos en memoria (con persistencia opcional en `localStorage` durante la sesión).

Una factory expuesta por env var `NEXT_PUBLIC_REAL_API_MODULES` selecciona qué módulos usan adapter real vs mock. Los hooks de TanStack Query consumen el puerto, **nunca el adapter directamente**.

**Mocks vía MSW (Mock Service Worker).** Los mock adapters delegan en MSW, que intercepta `fetch` reales y responde con datos consistentes. Ventajas: misma forma exacta que el backend devolverá, mismas URL paths, fácil de migrar a real cuando llegue.

**Alternativas evaluadas.**
1. **Construir solo lo conectable hoy** y dejar el resto como UI estática.
2. **Definir contratos OpenAPI antes** y generar tipos + mocks con Prism/Stoplight.

**Por qué.** La opción 1 retrasa validar el flujo completo end-to-end (login → publicar → buscar → comprar) y nos obliga a parar las ramas dependientes. La opción 2 introduce trabajo previo de spec con el equipo backend que no podemos forzar; además requiere coordinación constante. La capa mock intercambiable nos da:
- Trabajo desbloqueado: las 3 ramas avanzan sin esperar al backend.
- Inversión segura: cuando un módulo se libera, basta cambiar la env var (no se toca código de UI).
- Tipado fuerte: los Zod schemas son la única fuente de verdad y los mocks devuelven objetos que pasan ese schema.

**Consecuencias.**
- Cada vez que el backend libere un módulo nuevo, hay un PR pequeño que: (a) verifica que el HTTP adapter pasa los contract tests, (b) cambia el flag de env var, (c) marca el mock adapter como deprecado.
- **Riesgo a vigilar:** que el mock se desvíe de la forma real que el backend acabe exponiendo. **Mitigación:** definir los Zod schemas alineados con el README de UCs y el OpenAPI del módulo Catalog (que sí está disponible vía Postman). Cuando un nuevo endpoint se diseñe en backend, sincronizar primero el Zod schema.

**Cuándo reconsiderar.** Si el backend pasa a un ritmo donde libera módulos antes de que el frontend los use, el mock layer se convierte en peso muerto. En ese caso, eliminar mock adapters y consolidar en HTTP.

---

### ADR-005 — Auth.js v5 con providers Email + Google + Facebook

**Decidido.** Auth.js v5 (NextAuth) en `apps/web` con:
- **Credentials provider** para email + contraseña (UC-01).
- **Google** y **Facebook** providers (UC-01) — configurables vía env vars, deshabilitados si faltan credenciales (no se renderiza el botón).
- Sesión por **cookie HTTP-only firmada** (`session: { strategy: 'jwt' }`).
- El `authorize` del Credentials provider llama a `api.users.login()` — que hoy es mock, mañana es HTTP real.

**Alternativas evaluadas.**
1. **Custom auth con cookie + iron-session** — sin Auth.js.
2. **JWT en localStorage + Authorization header** — patrón clásico SPA.

**Por qué.** Auth.js v5 está rediseñado para Server Components y App Router de Next.js. Los providers OAuth ya están listos (no reinventamos OAuth flow). Sesión por cookie HTTP-only es más segura que localStorage (no XSS-explotable). Compatible con `auth()` server-side (Server Components leen sesión sin round-trip extra).

**Consecuencias.**
- Mientras el backend Catalog use header `X-User-Id`, el cliente HTTP del frontend lo inyecta automáticamente leyendo `userId` del JWT de Auth.js. Cuando el backend pase a JWT real, **el único cambio** es en el cliente HTTP (sustituir `X-User-Id` por `Authorization: Bearer <token>`).
- Datos de corredor (DNI, género, edad, talla, club, alergias — UC-09) NO viven en la sesión de Auth.js. Viven en `RunnerProfile` del dominio, sincronizados vía `api.users`. La sesión solo guarda `id`, `email`, `name`, `image`.
- Flujo: si el `RunnerProfile` está incompleto al entrar a `(app)/`, redirigimos a `/perfil/completar` antes de permitir comprar/publicar.

---

### ADR-006 — Server Components first, Client Components solo donde son necesarios

**Decidido.** Las páginas de `apps/web/app/` son Server Components por defecto. Solo se marcan `'use client'` los componentes con interactividad (formularios, filtros con estado local, animaciones, hooks que usan `useState`/`useEffect`/`useQuery`).

**Patrón de fetching.**
- Listado público (`/dorsales`): Server Component hace `api.dorsals.search()` para SSR + SEO; entrega `initialData` a un Client Component que toma el control para filtros interactivos (vía TanStack Query con `initialData`).
- Detalle (`/dorsales/[id]`): full Server Component con `revalidate = 300` (ISR cada 5 min). `generateMetadata` produce OG cards con foto, título, descripción.
- Publicar (`/vender`), formularios, login: full Client Component (interactividad pura).

**Alternativas evaluadas.**
1. **SPA puro Client Components** — habríamos perdido SEO y performance inicial.
2. **Server Actions para mutaciones** — Next.js soporta `<form action={serverAction}>`. Decidido **no** usarlo en MVP porque rompe el patrón de puerto+adapter (las server actions llaman al backend desde el server de Next, lo que añade un hop). TanStack Query + cliente HTTP nos da control fino y misma latencia. Reconsiderable.

**Por qué.** Un marketplace vive de SEO. Los detalles de dorsales tienen que ser indexables. Server Components hacen esto sin sacrificar la UX dinámica de filtros e interacción — combinado con TanStack Query y `initialData`, lo mejor de los dos mundos.

---

### ADR-007 — TanStack Query v5 para estado de servidor; Zustand puntual para UI persistente

**Decidido.** Tres tipos de estado, tres herramientas:
- **Servidor** (datos del backend): TanStack Query v5.
- **UI efímero** (modal abierto, paso de wizard, tab): `useState` / `useReducer`.
- **UI persistente** entre sesiones (filtros guardados, theme): Zustand con `persist` middleware (localStorage). **Uso puntual**, no global store.

**Convención de query keys:** `[recurso, vista, parámetros]`.
```
['dorsals', 'list', { filters }]
['dorsals', 'detail', id]
['users', 'me']
['transactions', 'mine']
```

**Alternativas evaluadas.**
1. **Redux Toolkit + RTK Query** — más boilerplate, menos elegante para Server Components.
2. **SWR** — más simple que TanStack Query pero menos features (mutaciones, optimistic updates, infinite queries son más limitadas).
3. **Solo Server Components + Server Actions** — sin estado cliente. Demasiado restrictivo para filtros interactivos y wizard de publicación.

**Por qué.** TanStack Query v5 es el estándar de facto para estado de servidor en React, especialmente con Server Components donde puede consumir `initialData` sin double-fetch. Maneja caché, dedup, background refetch, optimistic updates, infinite queries y paginación de forma idiomática.

**Consecuencias.** No hay store global tipo Redux. Si en el futuro hace falta orquestación compleja entre features (poco probable a esta escala), reconsideramos.

---

### ADR-008 — Tailwind CSS + shadcn/ui con tokens propios

**Decidido.** Tailwind CSS para estilos. shadcn/ui (componentes copiados al proyecto) para primitivas accesibles (Button, Dialog, Combobox, Sheet, Toast, Tabs, etc.). Los tokens del mockup (coral, oliva, radii, sombras) viven en `packages/ui-tokens` y se conectan a Tailwind vía `tailwind.config.ts` extend theme. CSS vars en `:root` y `[data-theme="light"]` permiten dark/light sin re-renderizar.

**Alternativas evaluadas.**
1. **CSS Modules + componentes propios + Radix UI primitives** — más control, más código a escribir (combobox, datepicker, focus traps).
2. **Mantine / Chakra UI** — librerías all-in-one con diseño propio. Customización de tema posible pero más fricción para parecerse al mockup.

**Por qué.** shadcn/ui da primitivas accesibles (basadas en Radix) **pero personalizables** porque viven en el repo, no son una dependencia opaca. El sistema de tokens del mockup mapea limpio a Tailwind extend theme. Iteración rápida, accesibilidad por defecto, y se ve igual al mockup. Mantine forzaría más reescrituras de tema; CSS Modules reinventaría primitivas accesibles que ya existen.

**Consecuencias.**
- Tailwind requiere disciplina con `@apply` y `clsx`/`cn` para mantener legibilidad — `cn()` helper en `lib/utils.ts`.
- shadcn/ui exige actualizar manualmente cuando hay cambios upstream — aceptado, los componentes son pocos.
- `lucide-react` para iconos (la lib que shadcn adopta).

---

### ADR-009 — Theming con next-themes + CSS vars

**Decidido.** `next-themes` para alternar `dark` (default) y `light`. Atributo `data-theme` en `<html>`. Sin flash al cargar (SSR-safe).

**Alternativas evaluadas.**
1. **Custom ThemeContext con localStorage** — reinventa la rueda.
2. **Tailwind dark mode media-query** — no permite override manual del usuario.

**Por qué.** `next-themes` está hecho para esto, soporta `class` y `attribute` strategies, y funciona con Server Components sin hacks. Los mockups ya estructuran el theming con `data-theme`, así que el CSS es portable casi 1:1.

---

### ADR-010 — Formularios: react-hook-form + Zod + shadcn/ui Form

**Decidido.** Pareja única en toda la app:
- `react-hook-form` para manejo de formularios.
- `zod` (mismos schemas que `packages/schemas`) con `@hookform/resolvers/zod`.
- `<Form />`, `<FormField />`, `<FormItem />`, `<FormLabel />`, `<FormMessage />` de shadcn/ui.

**Validación cruzada cliente/servidor.** El cliente valida con el mismo Zod schema que el adapter HTTP usa para parsear la respuesta. Si el backend devuelve 422 con detalles de campo, los mapeamos a `form.setError(field, message)`.

**Por qué.** RHF es el rey de performance en formularios React (re-renders mínimos). Zod compartido elimina duplicación de validación cliente/servidor/tipos. shadcn/ui Form integra ambos con UX accesible.

---

### ADR-011 — Subida de fotos vía presigned URLs S3

**Decidido.** UC-02 exige fotos. Patrón:
1. Cliente pide presigned URL: `api.uploads.createPresign({ contentType, sizeBytes })` → backend devuelve `{ url, fields, finalUrl }`.
2. Cliente hace `PUT/POST` directo a S3 con FormData.
3. Cliente envía `finalUrl` como `photo_url` al endpoint de creación de dorsal.

Mientras el backend no exponga el endpoint de presign, el mock adapter devuelve un object URL local (`URL.createObjectURL`) o sube a un bucket de Vercel Blob de dev. **Mismo contrato.** El componente `<PhotoUpload />` no se entera del cambio.

**Alternativas evaluadas.**
1. **Proxy de upload a través de Next.js route handler** — añade hop, satura ancho de banda del server, mal patrón para archivos grandes.
2. **Cloudinary / ImageKit / Vercel Blob** como CDN principal — válido si backend no quiere gestionar S3 directamente. Reconsiderable.

**Por qué.** Presigned URLs es el patrón estándar para uploads cliente→S3 directo, sin saturar al server de Next ni al backend. El backend mantiene control de acceso (firma).

---

### ADR-012 — Modelo de ramas paralelas partiendo de feat/foundation

**Decidido (actualizado 2026-05-14 para soportar varios devs en paralelo).**

```
main
 └── feat/foundation                        (rama de integración / "next", long-lived)
      ├── feat/dorsales                     PR ─┐
      ├── feat/usuarios                     PR ─┼─ se desarrollan EN PARALELO,
      └── feat/transacciones                PR ─┘  cada una sale directamente de feat/foundation
```

Las tres ramas de features parten de `feat/foundation` **directamente y en paralelo**. Cada dev coge la rama de su slice y avanza sin esperar al resto. Cada PR de feature va **contra `feat/foundation`**. Cuando se acumule un MVP estable en foundation, se abre un PR de foundation → `main` para release. Squash merge en todas las direcciones.

**Por qué paralelo y no secuencial.**
- Se incorporan varios desarrolladores al proyecto y no pueden bloquearse entre sí.
- Todos los módulos del backend (Catalog, Identity, Transaction) tienen contrato definido — Catalog y Transaction están **vivos** en el backend; Identity sigue mockeado pero su shape ya está acordado.
- La capa **mock intercambiable** (ADR-004) permite a cada rama desarrollar contra mocks sin necesitar que el backend del resto esté terminado.
- Foundation entrega todo lo compartido: design system, auth scaffolding, cliente API tipado, MSW para los módulos mockeados, layouts, providers. **Después de foundation, cada feature solo toca su slice.**

**Cómo evitamos conflictos al hacer PR.**

Cada rama es **dueña** de unos directorios y solo toca esos:

| Rama | Owns (cambia libremente) | Shared (avisar antes de tocar) |
|---|---|---|
| `feat/dorsales` | `apps/web/app/(app)/dorsales/**`, `apps/web/app/(app)/vender/**`, `apps/web/features/dorsals/**`, `apps/web/components/dorsal/**` | `packages/schemas/src/dorsal.ts`, `packages/api-client/src/{ports,adapters,msw}/dorsals*`, `packages/api-client/src/adapters/uploads-mock.ts` |
| `feat/usuarios` | `apps/web/app/(auth)/**`, `apps/web/app/(app)/perfil/**`, `apps/web/features/users/**`, `apps/web/components/user/**` | `packages/schemas/src/user.ts`, `packages/api-client/src/{ports,adapters,msw}/users*`, `apps/web/lib/auth.ts`, `apps/web/middleware.ts` |
| `feat/transacciones` | `apps/web/app/(app)/compra/**`, `apps/web/features/transactions/**`, `apps/web/components/transaction/**` | `packages/schemas/src/transaction.ts`, `packages/api-client/src/{ports,adapters,msw}/transactions*` |

Áreas verdaderamente compartidas (toque con coordinación, en un PR aparte si posible): `apps/web/components/layout/nav.tsx`, `apps/web/components/providers.tsx`, `apps/web/lib/http.ts`, `packages/api-client/src/factory.ts`, `packages/api-client/src/http.ts`, `packages/domain/**`.

**Convenciones.** Conventional Commits (`feat(dorsals):`, `fix(auth):`). PR descriptiva con UCs cubiertos, screenshots, follow-up. **Cada PR de feature va contra `feat/foundation`, no entre ramas.** Foundation → `main` es PR aparte cuando hay release.

**Alternativas evaluadas.**
1. **Secuencial** (versión original, descartada el 2026-05-14): bloqueaba a cada dev hasta que el anterior mergeaba.
2. **Una mega-rama con todo dentro**: peores conflictos, PR ingobernable.

**Cuándo reconsiderar.** Si un único dev se ocupa de las tres áreas, vuelve a tener sentido secuencial para reducir context-switching.

---

### ADR-013 — Pirámide de testing pragmática

**Decidido.**
- **Unit (Vitest):** funciones puras de `packages/domain`, schemas Zod (válidos e inválidos), adapters mock.
- **Component (Vitest + Testing Library):** componentes con lógica (form submit, filtros).
- **Integration (Vitest + MSW):** hooks TanStack Query contra MSW, flujos de mutación con invalidaciones.
- **E2E (Playwright):** 4-6 happy paths críticos: login, publicar dorsal, buscar+filtrar, comprar.

**No se persigue cobertura del 90%.** Se prueba donde aporta:
- Siempre: dominio, schemas, adapters, autorización.
- Casi siempre: hooks de mutación, formularios con validación cruzada.
- A veces: componentes presentacionales triviales.

**TDD donde aporta** (lógica de dominio, adapters, reglas de validación), no donde no (UI prototipos, componentes puramente visuales).

**Por qué.** Cobertura alta sin pensar quema tiempo en tests frágiles que se rompen al refactorizar. Probar el dominio (puro, estable) y los happy paths E2E (regresión real) da el mejor ratio confianza/esfuerzo.

---

### ADR-014 — CI con Turborepo + Vercel preview deployments

**Decidido.** GitHub Actions ejecuta `pnpm turbo run lint typecheck test build` por PR. Cache local y remota de Turborepo para reducir CI a segundos en cambios pequeños. Vercel conectado a `main` para producción y a cada PR para preview deployments (URL pública para validar visualmente).

**Por qué.** Turborepo cachea por paquete: cambios en `packages/schemas` solo recompilan/testean lo dependiente. Vercel previews son tracción para code review (compañeros validan visual sin checkout local).

---

### ADR-015 — Observabilidad mínima viable

**Decidido.**
- **Errores client:** Sentry (free tier) — errores no controlados, replay opcional.
- **Web Vitals:** Vercel Analytics — LCP, CLS, INP por ruta.
- **Logs server:** `pino` con pretty en dev, JSON en prod — Server Components, route handlers.
- **Tracing UC críticos:** eventos custom (publicar dorsal, comprar) con Plausible o PostHog (decisión tomada antes de prod).

Sentry y analytics en `feat/foundation` con env vars vacías por defecto (no envían nada en dev). Se activan poniendo el DSN en producción.

**Por qué.** Sentry + Vercel cubren 95% de lo que duele en producción a este tamaño. Plausible/PostHog se decide más tarde porque el funnel no es crítico hasta que hay tráfico real.

---

### ADR-016 — Seguridad mínima: CSP, env validation, rate limiting

**Decidido.**
- **CSP headers** y demás security headers en `next.config.ts`.
- **Validación de env vars con Zod** al arrancar (`apps/web/lib/env.ts`) — falla rápido si faltan vars.
- **Rate limiting** en route handlers sensibles (login, publicar) con Vercel Edge Config o `next-rate-limit`.
- **CSRF**: Auth.js v5 lo maneja por sus rutas; en route handlers propios usar mismo origen + cookie SameSite=Lax.
- **`eslint-plugin-jsx-a11y`** activado en CI (errores rotos rompen build).

**Por qué.** Mínimos higiénicos no negociables para producción. No es trabajo "extra", es trabajo "habitual" que si se aplaza luego cuesta el doble.

---

## 4. Estructura final de carpetas

### Monorepo

```
dorsal.market/
├── apps/
│   ├── web/                        # Next.js 15 — App Router (PRIORIDAD MVP)
│   └── mobile/                     # Expo + React Native (fase posterior, scaffold vacío)
├── packages/
│   ├── api-client/                 # Puertos + adapters HTTP/mock + hooks TanStack Query
│   │   ├── src/
│   │   │   ├── ports/              # DorsalsPort, UsersPort, TransactionsPort, ReviewsPort
│   │   │   ├── adapters/           # *-http.ts, *-mock.ts
│   │   │   ├── hooks/              # useDorsalsList, useDorsalDetail, usePublishDorsal, ...
│   │   │   ├── http.ts             # createHttp({ baseUrl, getUserId })
│   │   │   ├── factory.ts          # createApi() — selecciona adapters por env var
│   │   │   ├── msw/                # handlers de MSW para mocks
│   │   │   └── errors.ts           # UnauthorizedError, NotFoundError, ValidationError, ...
│   │   └── package.json
│   ├── domain/                     # Lógica pura sin I/O (canBuyDorsal, calculateEscrowSteps, ...)
│   ├── schemas/                    # Zod schemas: dorsal, user, transaction, review, common
│   ├── ui-tokens/                  # Design tokens (colors, radius, fonts) en TS
│   ├── eslint-config/              # Config Biome/ESLint compartida
│   └── tsconfig/                   # Configs TS base (base.json, nextjs.json, react-native.json)
├── docs/
│   └── superpowers/
│       ├── specs/                  # Este doc + futuros specs
│       └── plans/                  # Plans de implementación (uno por rama)
├── mockups/                        # 6 HTML de referencia (movidos desde raíz)
├── package.json                    # Root workspace
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── .gitignore
└── README.md
```

### apps/web

```
apps/web/
├── app/
│   ├── (marketing)/                # Páginas SEO públicas, SSG/ISR
│   │   ├── page.tsx                # Landing (mockup index.html)
│   │   ├── como-funciona/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                      # App autenticada/navegable
│   │   ├── layout.tsx              # Protege rutas, nav con sesión
│   │   ├── dorsales/
│   │   │   ├── page.tsx            # Listado + filtros (UC-04)
│   │   │   └── [id]/page.tsx       # Detalle (UC-05) — ISR
│   │   ├── vender/page.tsx         # Publicar dorsal (UC-02)
│   │   ├── perfil/
│   │   │   ├── page.tsx            # UC-09
│   │   │   └── historial/page.tsx  # UC-10
│   │   └── compra/
│   │       ├── [transactionId]/page.tsx  # Timeline (UC-07/08)
│   │       └── confirmada/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── upload/route.ts         # Si hace falta proxy (no el caso por defecto)
│   ├── layout.tsx                  # Root: fuentes, ThemeProvider, providers
│   ├── globals.css                 # Tailwind base + CSS vars
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                         # shadcn/ui generados
│   ├── dorsal/                     # DorsalCard, DorsalGrid, DorsalFiltersBar
│   ├── form/                       # Field, Combobox, FileDrop wrappers
│   ├── layout/                     # Nav, Footer, ThemeToggle, MobileMenu
│   └── feedback/                   # Toaster, ErrorBoundary, EmptyState, LoadingState
├── features/
│   ├── dorsals/{server, hooks, components, schemas}/
│   ├── auth/
│   ├── users/
│   └── transactions/
├── lib/
│   ├── auth.ts                     # config Auth.js v5
│   ├── api.ts                      # instancia tipada del cliente API + fetcher SSR
│   ├── env.ts                      # validación de env vars con Zod
│   └── utils.ts                    # cn(), formatters
├── hooks/                          # useDebounce, useMediaQuery, useFiltersUrlSync
├── styles/
├── public/
├── e2e/                            # Playwright
├── tailwind.config.ts
├── next.config.ts
├── biome.json (extends)
├── tsconfig.json
└── package.json
```

---

## 5. Variables de entorno

Validadas con Zod en `apps/web/lib/env.ts`. La aplicación falla al arrancar si faltan.

```
# Backend
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Mock layer (qué módulos usan adapter real vs mock)
NEXT_PUBLIC_REAL_API_MODULES=dorsals          # csv: dorsals,users,transactions,reviews

# Auth.js
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# OAuth (opcional — sin estos, solo se muestra login email+password)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Stripe (cuando llegue)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# S3 / presign (cuando llegue)
AWS_REGION=
S3_BUCKET=

# Observabilidad (opcional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 6. Mapeo de mockups a rutas

| Mockup HTML | Ruta Next.js | UCs | Tipo |
|---|---|---|---|
| `index.html` | `/` (marketing) | — | Server Component (SSG) |
| `dorsales.html` | `/dorsales` | UC-04 | Server Component + Client (filtros) |
| `dorsal-detalle.html` | `/dorsales/[id]` | UC-05 | Server Component (ISR 5min) |
| `vender-dorsal.html` | `/vender` | UC-02 | Client Component (RHF wizard) |
| `compra-confirmada.html` | `/compra/confirmada` | UC-06 | Server Component |
| `perfil.html` | `/perfil` | UC-09 | Client Component (RHF) |
| (nuevos) | `/login`, `/registro` | UC-01 | Client Component |
| (nuevo) | `/perfil/historial` | UC-10 | Server Component + Client |
| (nuevo) | `/compra/[transactionId]` | UC-07/08 | Client Component (timeline) |

---

## 7. Roadmap por ramas (alto nivel)

### feat/foundation — PR #1

Scaffolding del monorepo y todo lo compartido. Sin features de usuario.
- Monorepo pnpm + Turborepo + tsconfig + Biome.
- `apps/web` con Next.js 15, App Router, Tailwind+shadcn, next-themes, Auth.js v5 con mock provider.
- `packages/{schemas, api-client, domain, ui-tokens}` con interfaces y schemas base.
- MSW dev server con handlers vacíos.
- CI GitHub Actions con turbo cache.
- Vercel preview deployments.
- Mover mockups a `mockups/`.
- Rama: `feat/foundation` parte de `main` y queda como rama de integración long-lived. Las tres features ramifican directamente desde aquí.

### feat/dorsales — PR #2 (paralelo)

UCs 02, 04, 05 contra backend Catalog **real** (`localhost:8000` o staging).
- `/dorsales` (lista + filtros + paginación).
- `/dorsales/[id]` (detalle + OG + ISR).
- `/vender` (wizard + upload fotos vía presign mock).
- HTTP adapter `DorsalsHttpAdapter` con contract tests.
- Tests de integración con backend en local.

### feat/usuarios — PR #3 (paralelo)

UCs 01, 09, 10, 11. **Backend Identity mockeado** vía MSW (la historia de uso completa con datos de demo persistidos en `localStorage` para la sesión de dev).
- `/login`, `/registro` (Credentials + OAuth opcionales).
- `/perfil` (datos identidad + contacto + corredor).
- `/perfil/historial` (compras + ventas) — UC-10 hidrata desde el módulo Transaction real (ver siguiente rama) en cuanto el dev configura JWT.
- UC-11 (reseñas) — versión mínima en MVP.
- Mock adapter `UsersMockAdapter` con datos persistidos en localStorage por sesión de dev.

### feat/transacciones — PR #4 (paralelo)

UCs 03, 06, 07, 08 contra backend Transaction **real** (`localhost:8000`). El backend de Transaction está vivo desde 2026-05-14; el contrato real está en `postman/transaction_bounded_context.postman_collection.json`.
- **Seller onboarding** (`POST /api/v1/sellers/onboard`) — prerequisito para vender, lanza Stripe Connect.
- **Reserva** (`POST /api/v1/transactions`) — body `{dorsal_id, buyer_id}` devuelve reservation + Stripe PaymentIntent → Stripe Elements en modo test.
- **Tracking buyer/seller** — vistas diferenciadas (`GET /api/v1/transactions/buyer/{id}` vs `seller/{id}`). El timeline se compone de eventos: `transfer-in-progress`, `upload-proof`/`proof`, `confirm`, `dispute`.
- **Upload de prueba de transferencia** — dos rutas: presigned URL (`proof-upload-url` + `proof`) o multipart directo (`upload-proof`).
- **Disputas** (`POST /api/v1/transactions/{id}/dispute`) — buyer abre disputa; resolución la maneja admin (fuera de scope MVP).
- **Seller problem reports** (`POST /api/v1/transactions/{id}/seller-problem-reports`) — soporte post-resolución para el vendedor (race rechazó cambio, problema de payout, etc.). Categorías: `buyer_data_issue, race_rejected_transfer, payment_or_payout_issue, other`.
- **Webhooks Stripe** los maneja el backend; el frontend solo refresca via polling (`refetchInterval: 10s`) hasta que el estado avance.

---

## 8. Cómo se incorpora un nuevo dev al proyecto

1. Lee el [`README.md`](../../../README.md) (visión general + comandos).
2. Lee este documento entero para entender la arquitectura (`docs/superpowers/specs/2026-05-09-frontend-architecture-design.md`).
3. Lee el README del backend (repo paralelo) y las dos Postman: `postman/dorsales-api.postman_collection.json` (Catalog), `postman/transaction_bounded_context.postman_collection.json` (Transaction).
4. Elige la rama que vas a tomar y lee su doc en [`docs/branches/`](../../branches/).
5. `pnpm install`, copia `.env.example` a `apps/web/.env.local`, configura al menos `NEXTAUTH_SECRET`.
6. `pnpm dev` arranca `apps/web` con MSW activo para módulos mockeados.
7. Para conectar un módulo real, edita `NEXT_PUBLIC_REAL_API_MODULES` en `apps/web/.env.local` y levanta el backend en `localhost:8000`.
8. Cualquier feature nueva no trivial: invocar `superpowers:brainstorming` primero (ver `feedback_superpowers` en memoria del proyecto).

---

## 9. Decisiones diferidas (no bloqueantes para MVP)

| Tema | Cuándo decidir |
|---|---|
| Plausible vs PostHog para funnel analytics | Antes de prod |
| Cloudinary vs S3 directo para fotos | Cuando backend libere endpoint presign |
| Internacionalización (i18n) | Después de MVP, si entra mercado fuera de ES |
| PWA / manifest / offline | Después de MVP, si valida web |
| Server Actions de Next.js | Si TanStack Query+adapter resulta verbose |
| Real-time chat (UC-08): WebSocket vs polling vs Pusher | En `feat/transacciones` |

---

## 10. Glosario rápido

- **UC-XX:** Caso de uso XX según README del backend.
- **Puerto:** Interfaz TypeScript en `packages/api-client/ports/`.
- **Adapter:** Implementación de un puerto (HTTP o Mock).
- **Server Component (RSC):** Componente Next.js que se renderiza solo en server.
- **MSW:** Mock Service Worker — librería que intercepta `fetch` para mocks.
- **ISR:** Incremental Static Regeneration — Next.js re-genera páginas estáticas cada N segundos.
- **OG card:** Open Graph metadata para previews en redes sociales.
- **Token (de diseño):** Variable nombrada de la paleta/escala (ej: `--coral`, `radius.md`).

---

## 11. Próximo paso

Tras la aprobación de este spec, se invoca `superpowers:writing-plans` para producir el plan de implementación detallado. Habrá un plan por rama (`feat/foundation`, `feat/dorsales`, `feat/usuarios`, `feat/transacciones`), guardados en `docs/superpowers/plans/`.
