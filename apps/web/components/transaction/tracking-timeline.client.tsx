'use client';
import { TrackingStep } from '@/components/transaction/tracking-step';
import { useTranslations } from 'next-intl';
import type { TimelineEvent } from '@dorsal/schemas';

export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations('tracking');
  if (!events.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
        {t('no_events')}
      </div>
    );
  }

  return (
    <ol className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
      {events.map((event, index) => (
        <TrackingStep key={`${'type' in event ? event.type : event.key}-${index}`} event={event} />
      ))}
    </ol>
  );
}
