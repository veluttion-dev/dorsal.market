'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { FeedbackDialog } from './feedback-dialog.client';

export function FeedbackTab() {
  const t = useTranslations('feedback');
  const [open, setOpen] = useState(false);
  const tabRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      return;
    }

    if (hasOpenedRef.current) {
      tabRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {!open && (
        <button
          ref={tabRef}
          type="button"
          aria-label={t('tab_aria')}
          className="fixed right-[-34px] top-1/2 z-40 h-11 w-28 -translate-y-1/2 -rotate-90 rounded-t-md bg-coral text-sm font-medium text-white shadow-elevated transition-colors hover:bg-coral-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          onClick={() => setOpen(true)}
        >
          {t('tab_button')}
        </button>
      )}
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
