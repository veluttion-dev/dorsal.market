import { EVENT_LABEL, formatEventDate } from '@/features/transactions/lib/labels';
import type { TimelineEvent } from '@dorsal/schemas';
import { CheckCircle2 } from 'lucide-react';

export function TrackingStep({ event }: { event: TimelineEvent }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-olive" />
      <div>
        <p className="font-medium">{EVENT_LABEL[event.type]}</p>
        <p className="text-sm text-text-secondary">{formatEventDate(event.at)}</p>
      </div>
    </li>
  );
}
