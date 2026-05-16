'use client';
import { Button } from '@/components/ui/button';
import { parseAsInteger, useQueryStates } from 'nuqs';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const [, set] = useQueryStates({ page: parseAsInteger }, { history: 'push', shallow: false });
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => void set({ page: page - 1 })}>
        Anterior
      </Button>
      <span className="text-sm text-text-secondary">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => void set({ page: page + 1 })}
      >
        Siguiente
      </Button>
    </div>
  );
}
