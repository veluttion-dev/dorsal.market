'use client';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { parseAsInteger, useQueryStates } from 'nuqs';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const t = useTranslations('pagination');
  const [, set] = useQueryStates({ page: parseAsInteger }, { history: 'push' });
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => void set({ page: page - 1 })}>
        {t('previous')}
      </Button>
      <span className="text-sm text-text-secondary">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => void set({ page: page + 1 })}
      >
        {t('next')}
      </Button>
    </div>
  );
}
