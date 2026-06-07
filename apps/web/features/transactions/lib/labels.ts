import type { TimelineEventType, TransactionStatus } from '@dorsal/schemas';

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAYMENT_RECEIVED: 'Pago recibido',
  TRANSFER_IN_PROGRESS: 'Cambio iniciado',
  TRANSFER_SUBMITTED: 'Prueba enviada',
  IN_DISPUTE: 'Disputa abierta',
  RELEASED_TO_SELLER: 'Fondos liberados',
  REFUNDED_TO_BUYER: 'Reembolsada',
  CANCELLED: 'Cancelada',
};

export const EVENT_LABEL: Record<TimelineEventType, string> = {
  reservation_created: 'Reserva creada',
  payment_succeeded: 'Pago confirmado',
  transfer_in_progress: 'Cambio en proceso',
  proof_submitted: 'Prueba enviada',
  transfer_confirmed: 'Cambio confirmado',
  funds_released: 'Fondos liberados',
  dispute_opened: 'Disputa abierta',
  dispute_resolved: 'Disputa resuelta',
  refunded: 'Reembolso emitido',
};

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
