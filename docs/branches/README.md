# Docs por rama

Este directorio contiene una **guía de onboarding por rama de feature**. Cada doc cubre:

- Qué UCs cubre la rama
- Estado del backend (real vs mockeado vía MSW)
- Slice de archivos owned (los que tocas libremente)
- Zonas compartidas y cómo coordinar
- Checklist de tareas de alto nivel
- Cómo empezar (preflight)
- Status actual

La descripción **técnica detallada paso a paso** de cada rama vive en su plan de implementación correspondiente (`docs/superpowers/plans/2026-05-09-feat-*.md`).

Para entender el modelo de ramas paralelas, lee [ADR-012](../superpowers/specs/2026-05-09-frontend-architecture-design.md#adr-012--modelo-de-ramas-paralelas-partiendo-de-featfoundation).

| Rama | UCs | Backend | Doc |
|---|---|---|---|
| `feat/dorsales` | UC-02, UC-04, UC-05 | ✅ Catalog vivo | [`feat-dorsales.md`](feat-dorsales.md) |
| `feat/usuarios` | UC-01, UC-09, UC-10, UC-11 | ⏳ Mockeado (MSW) | [`feat-usuarios.md`](feat-usuarios.md) |
| `feat/transacciones` | UC-03, UC-06, UC-07, UC-08 | ✅ Transaction vivo | [`feat-transacciones.md`](feat-transacciones.md) |

## Antes de tomar una rama

1. Asegúrate de partir de la última versión de `feat/foundation` (`git switch feat/foundation && git pull`).
2. Lee el [README del proyecto](../../README.md) y el [spec de arquitectura](../superpowers/specs/2026-05-09-frontend-architecture-design.md).
3. Lee el doc de **tu rama** entero antes de empezar a programar.
4. Lee el plan correspondiente (`docs/superpowers/plans/2026-05-09-feat-<rama>.md`) cuando vayas a implementar cada task.
5. Anuncia en el canal del equipo qué rama vas a coger para evitar duplicidad.

## Regla de oro para evitar conflictos

> Solo tocas archivos dentro de tu **slice owned**. Si necesitas tocar una **zona compartida**, abres un PR aparte (rama `chore/<motivo>` o `docs/<motivo>`) o avisas en el canal antes de tocarlo.
