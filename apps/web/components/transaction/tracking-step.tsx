import { EVENT_LABEL, formatEventDate } from '@/features/transactions/lib/labels';
import type { TimelineEvent } from '@dorsal/schemas';
import { CheckCircle2, Circle } from 'lucide-react';

export function TrackingStep({ event }: { event: TimelineEvent }) {
  const label = 'type' in event ? EVENT_LABEL[event.type] : event.label;
  const date = 'at' in event ? event.at : event.completed_at;
  const completed = Boolean(date);

  return (
    <li className="flex gap-3">
      {completed ? (
        <>
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-olive" aria-hidden="true" />
          <span className="sr-only">Paso completado</span>
        </>
      ) : (
        <>
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="sr-only">Paso pendiente</span>
        </>
      )}
      <div>
        <p className="font-medium">{label}</p>
        {date && <p className="text-sm text-text-secondary">{formatEventDate(date)}</p>}
      </div>
    </li>
  );
}
