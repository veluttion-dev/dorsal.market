# Sistema global de feedback de usuarios

## Objetivo

Anadir a `dorsal.market` un canal de feedback accesible desde toda la web para recibir comentarios accionables por correo electronico, sin tocar el backend `MVP-Dorsales`.

El MVP debe permitir recoger errores, fricciones y dudas reales del flujo de compra, venta y perfil, manteniendo la implementacion preparada para migrar en el futuro a un sistema formal de soporte con el minimo cambio posible.

## Alcance

Incluido:

- Pestana global de feedback visible en toda la app web.
- Modal de envio con mensaje obligatorio y email de contacto opcional.
- API route de Next.js para validar y enviar el feedback desde servidor.
- Integracion inicial con Resend.
- Abstraccion `FeedbackSink` para cambiar el destino en el futuro.
- Tests unitarios/integracion de formulario, validacion y route handler.

Excluido:

- Cambios en `MVP-Dorsales`.
- Persistencia en base de datos.
- Adjuntos, estados de ticket, SLA, asignacion interna o historial de soporte.
- Categorias de feedback en el formulario.
- Alertas preventivas de cuota de Resend con persistencia.

## Experiencia de usuario

La entrada global sera una pestana lateral derecha con el texto `Feedback`.

Comportamiento visual aprobado:

- En desktop y movil se mantiene lateral.
- La pestana queda centrada verticalmente y pegada al borde derecho.
- Usa el color coral del sistema visual.
- La parte visible puede ser fina, pero el area tactil real debe ser de al menos 44 px.
- La pestana se oculta o queda inactiva mientras el modal esta abierto.
- Debe tener foco visible, `aria-label` y nombre accesible.

El formulario no tendra categorias. Campos:

- `Mensaje`: obligatorio.
- `Email de contacto`: opcional.

Microcopy del modal:

```text
Ayudanos a mejorar dorsal.market con feedback concreto: errores que encuentres, partes del proceso que no se entienden, pasos que te resulten confusos al comprar o vender, o ideas que faciliten completar una tarea.
```

Placeholder del mensaje:

```text
Ejemplo: "Al publicar un dorsal no entiendo que datos vera el comprador..."
```

Ayuda del email:

```text
Solo lo usaremos si necesitamos entender mejor tu feedback o responderte.
```

## Arquitectura

Todo vive en `dorsal.market/apps/web`.

Flujo:

```text
FeedbackTab global
  -> FeedbackDialog
  -> POST /api/feedback
  -> submitFeedback()
  -> FeedbackSink
  -> ResendFeedbackSink
```

Modulos propuestos:

- `apps/web/components/feedback/feedback-tab.client.tsx`
- `apps/web/components/feedback/feedback-dialog.client.tsx`
- `apps/web/app/api/feedback/route.ts`
- `apps/web/lib/feedback/types.ts`
- `apps/web/lib/feedback/submit-feedback.ts`
- `apps/web/lib/feedback/sinks/resend-feedback-sink.ts`

La app no debe depender directamente de Resend fuera del adaptador. El caso de uso solo conoce el contrato `FeedbackSink`.

Contrato conceptual:

```ts
type FeedbackPayload = {
  message: string;
  contactEmail?: string;
  pageUrl?: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  submittedAt: string;
};

interface FeedbackSink {
  send(payload: FeedbackPayload): Promise<FeedbackSendResult>;
}
```

En el futuro se podran implementar adaptadores como `SesFeedbackSink`, `ZendeskFeedbackSink`, `FreshdeskFeedbackSink`, `LinearFeedbackSink` o `BackendApiFeedbackSink` sin cambiar el formulario.

## Variables de entorno

Servidor:

```env
RESEND_API_KEY=
FEEDBACK_TO_EMAIL=
FEEDBACK_FROM_EMAIL=
```

`RESEND_API_KEY` nunca debe exponerse al cliente.

`FEEDBACK_FROM_EMAIL` debe usar un remitente verificado por Resend. `FEEDBACK_TO_EMAIL` sera el correo interno que recibe los feedbacks.

## Validacion

Cliente y servidor deben validar:

- `message`: string recortado, minimo 20 caracteres, maximo razonable para email, por ejemplo 4000 caracteres.
- `contactEmail`: opcional; si existe, debe ser email valido.
- `pageUrl`: opcional; se envia desde `window.location.href` y se trata como contexto, no como dato confiable.

El servidor debe volver a validar todo el payload aunque el cliente ya lo haya hecho.

## Formato del correo

El correo interno debe incluir:

- Mensaje del usuario.
- Email de contacto, si existe.
- URL desde donde se envio.
- User-agent.
- Fecha ISO de envio.
- Usuario autenticado si la sesion esta disponible: id, email y nombre.

Asunto sugerido:

```text
[dorsal.market] Nuevo feedback de usuario
```

## Errores y estados

Estados del formulario:

- Idle.
- Enviando.
- Enviado.
- Error.

Comportamiento:

- Durante el envio, el boton queda deshabilitado.
- En exito, se cierra el modal y se muestra toast: `Gracias, hemos recibido tu feedback`.
- En error de validacion, se muestra mensaje inline.
- Si Resend responde con cuota agotada (`429`), se muestra: `Ahora mismo no podemos recibir mas feedback. Intentalo mas tarde.`
- En otros errores: `No se pudo enviar el feedback. Intentalo de nuevo.`

El route handler debe mapear errores internos a respuestas HTTP estables:

- `400` para payload invalido.
- `429` para cuota agotada del proveedor.
- `500` para fallo inesperado de envio.

## Cuotas de Resend

Resend Free limita a 100 emails/dia y 3000 emails/mes. Si se supera el limite, devuelve `429` y no cobra automaticamente en el plan gratuito.

Para el MVP:

- No se implementan alertas preventivas de cuota.
- Si se recibe `429`, se devuelve un error amable al usuario.
- El adaptador debe dejar el caso distinguible para anadir alerta o persistencia mas adelante.

## Pruebas

Tests previstos:

- El tab global abre el modal.
- El formulario bloquea mensajes vacios o demasiado cortos.
- El email opcional se valida solo si se rellena.
- El envio correcto llama a `/api/feedback` y muestra toast de exito.
- El error `429` muestra el mensaje de cuota.
- La route rechaza payload invalido con `400`.
- La route llama al `FeedbackSink` con mensaje y contexto normalizados.
- El adaptador de Resend traduce cuota agotada a un error de dominio.

## Decision

Se elige el enfoque B: MVP con Resend dentro de una arquitectura agnostica basada en `FeedbackSink`.

Esta opcion entrega valor rapido sin tocar el backend principal y conserva una frontera clara para migrar a soporte formal cuando aparezcan necesidades de tickets, historial, adjuntos o reporting.
