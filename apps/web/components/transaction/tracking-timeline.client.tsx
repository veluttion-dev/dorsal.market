'use client';
import { TrackingStep } from '@/components/transaction/tracking-step';
import type { TimelineEvent } from '@dorsal/schemas';

export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
        Aun no hay eventos.
      </div>
    );
  }

  return (
    <ol className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
      {events.map((event, index) => (
        <TrackingStep key={`${event.type}-${event.at}-${index}`} event={event} />
      ))}
    </ol>
  );
}
