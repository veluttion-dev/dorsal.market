# Revisión técnica tipo PR — `feat/dorsales` → `feat/foundation`

**Fecha:** 2026-05-18  
**Rango revisado:** `22f8621d689bc556820c9459c517fca493bc1f10..42dc9d0e90c2d74ee92085b26834ba8acb6c90d4`  
**Veredicto:** **No mergear todavía**

## Resumen ejecutivo

La rama `feat/dorsales` está bastante avanzada y deja implementado de verdad el slice Catalog:

- `/dorsales`
- `/dorsales/[id]`
- `/vender`
- filtros sincronizados con URL
- detalle con ISR y metadata
- wizard de publicación
- tests unitarios/componentes y E2E específicos de dorsales

La dirección general es buena, pero antes de mergear conviene resolver tres issues importantes:

1. El wizard de publicación rechaza payloads válidos y puede dejar al usuario sin feedback útil.
2. SSR y cliente no reconstruyen el mismo conjunto de filtros desde la URL.
3. El E2E de publicación no modela el flujo real protegido por auth.

---

## Hallazgos

### 1. Bloqueante — el wizard de publicación rechaza payloads válidos y el fallo queda casi silencioso

**Archivos:**

- `apps/web/features/dorsals/components/publish-wizard.client.tsx`
- `packages/schemas/src/dorsal.ts`

**Líneas relevantes:**

- `publish-wizard.client.tsx`: 35–41, 44–57, 175–205
- `dorsal.ts`: 63–91

#### Qué pasa

El formulario inicializa varios campos opcionales con strings vacíos:

```ts
contact: { phone: '', email: '', phone_visible: true, email_visible: true }
```

y los inputs que el usuario deja vacíos también llegan como `''`.

Pero el schema espera valores como:

```ts
email: z.string().email().nullable().optional()
race_name: z.string().min(1).optional()
bib_number: z.string().min(1).optional()
```

Eso provoca varios problemas:

- publicar con **solo teléfono** y email vacío falla, aunque el contrato Postman permite `email: null`;
- guardar borrador con campos no rellenados también puede fallar, porque varios “opcionales” llegan como `''`, no como `undefined` o `null`;
- la UI solo muestra error inline para `photo_url`, así que muchos fallos de validación no dan feedback útil al usuario.

Además, `submitAsDraft()` deja `publish=false` en el estado del form. Si el intento de borrador falla y luego el usuario completa el formulario y pulsa **Publicar dorsal**, puede terminar guardando otro borrador sin querer.

#### Por qué importa

Este flujo es el núcleo de **UC-02 publicar dorsal**. Tal como está, la experiencia no es suficientemente robusta para mergear.

#### Qué pediría antes del merge

- Normalizar valores vacíos antes de validar/enviar:
  - `'' -> undefined` para opcionales;
  - `'' -> null` donde el contrato backend usa `null`.
- Mostrar errores inline al menos en los campos relevantes del formulario.
- Evitar que el intento de “Guardar borrador” deje el form permanentemente con `publish=false`.

---

### 2. Importante — SSR y cliente no usan el mismo conjunto de filtros

**Archivos:**

- `apps/web/app/(app)/dorsales/dorsals-list.client.tsx`
- `apps/web/app/(app)/dorsales/page.tsx`
- `apps/web/features/dorsals/lib/filters-url.ts`

**Líneas relevantes:**

- `dorsals-list.client.tsx`: 23–41
- `page.tsx`: 19–29
- `filters-url.ts`: 3–15

#### Qué pasa

La página server sí entiende desde la URL:

- `date_from`
- `date_to`
- `sort_by`
- `sort_order`
- `page_size`

porque `parseFiltersFromSearchParams()` los parsea.

Pero el cliente solo reconstruye:

- `race_name`
- `location`
- `distance`
- `price_min`
- `price_max`
- `payment_method`
- `page`

Resultado: una URL compartida puede renderizar correctamente en SSR, pero después el cliente refetchea sin parte de esos filtros y sustituye la lista por resultados distintos.

#### Por qué importa

Rompe una de las promesas centrales de **UC-04**: filtros compartibles y consistentes por URL.

#### Qué pediría antes del merge

Elegir una de estas dos direcciones y dejarla coherente:

1. incluir esos filtros también en `DorsalsListClient`, o
2. recortar explícitamente el alcance actual y no afirmar soporte donde todavía no lo hay.

---

### 3. Importante — el E2E de publicación no modela el flujo real protegido

**Archivos:**

- `apps/web/e2e/dorsals-publish.spec.ts`
- `apps/web/auth.config.ts`

**Líneas relevantes:**

- `dorsals-publish.spec.ts`: 4–22
- `auth.config.ts`: 6–13

#### Qué pasa

El test entra directamente en:

```ts
await page.goto('/vender');
```

pero `/vender` está marcado como ruta protegida:

```ts
nextUrl.pathname.startsWith('/vender')
```

Sin sesión, el flujo real debería redirigir a login.

Además, en el estado actual del repo, el mock de Identity vive en MSW del navegador, mientras que `Credentials.authorize()` corre en servidor. Eso hace que el seed user documentado no sea trivialmente utilizable para autenticar el flujo real de `/vender`.

#### Por qué importa

Ese E2E pretende demostrar el happy path de publicación, pero en su forma actual no verifica el flujo real que verá un usuario.

#### Qué pediría antes del merge

- Preparar sesión autenticada para el test, o
- separar temporalmente la cobertura del formulario del requisito de auth y documentar explícitamente el gap.

Lo que evitaría es dejar el test actual como si demostrara un happy path real completo.

---

## Hallazgos menores / no bloqueantes

### A. El parser de filtros no “descarta inválidos”; descarta todo

**Archivo:** `apps/web/features/dorsals/lib/filters-url.ts`

El comentario dice que los valores inválidos se descartan, pero si un único campo invalida el objeto completo, `safeParse()` falla y se devuelve `{}`.

Ejemplo:

```txt
distance=10k&sort_by=relevance
```

debería poder conservar `distance=10k`, pero hoy se pierde todo.

### B. `PhotoUpload` crea `objectURL`s y nunca los revoca

**Archivos:**

- `apps/web/features/dorsals/hooks/use-presign-photo.ts`
- `apps/web/components/form/photo-upload.client.tsx`

Es un leak pequeño, pero fácil de limpiar.

### C. La doble llamada a `getDorsalDetail()` no duplica la llamada de red

**Archivo:** `apps/web/app/(app)/dorsales/[id]/page.tsx`

Se llama a `getDorsalDetail(id)` en `generateMetadata()` y otra vez en el render, pero en Next.js 16 los `fetch` GET idénticos dentro del mismo render pass se memoizan entre `generateMetadata`, Pages, Layouts y Server Components.

En este caso `getDorsalDetail()` acaba en `http.get()` y por debajo usa `fetch()` con método GET para la misma URL, así que no debería producir dos llamadas de red al backend Catalog. Envolver el helper en `cache()` podría hacerlo explícito y evitar algo de trabajo alrededor del fetch, pero no es una corrección necesaria para mergear.

---

## Puntos positivos

- La separación entre server fetchers, hooks y componentes está limpia.
- `nuqs` está bien integrado en providers.
- El detalle con ISR + metadata está bien orientado.
- La rama respeta bastante bien el slice ownership descrito en docs.
- El wrapper de upload mock está pensado con una transición razonable a presigned URL real.
- `git diff --check feat/foundation...feat/dorsales` no detectó problemas de whitespace.

---

## Evidencia y límites de la revisión

Se revisó estáticamente el diff completo entre:

- base: `feat/foundation`
- head: `feat/dorsales`

También se contrastó la implementación con:

- `postman/dorsales-api.postman_collection.json`
- `docs/branches/feat-dorsales.md`
- `docs/superpowers/plans/2026-05-09-feat-dorsales.md`

No se pudieron ejecutar:

- `pnpm test`
- `pnpm typecheck`
- `pnpm test:e2e`

porque en esta shell no estaban disponibles `node` ni `pnpm`.

Por tanto, esta revisión **no afirma que el pipeline esté verde**; es una revisión estática de merge-readiness.

---

## Recomendación final

Antes de mergear, resolvería en este orden:

1. normalización + errores del publish wizard;
2. alineación SSR/cliente en filtros URL;
3. corrección del E2E de `/vender` con auth realista.

Después de esos tres cambios, `feat/dorsales` debería quedar en una posición mucho más sólida para integrarse en `feat/foundation`.
