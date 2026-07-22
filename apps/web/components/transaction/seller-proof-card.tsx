import { Button } from '@/components/ui/button';
import { FileCheck2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SellerProofCard({ proofUrl }: { proofUrl: string | null }) {
  const t = useTranslations('seller_proof');

  if (!proofUrl) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-bg-card p-5">
      <div className="flex items-start gap-3">
        <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-olive" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('description')}</p>
        </div>
      </div>
      <Button asChild variant="outline">
        <a href={proofUrl} target="_blank" rel="noreferrer">
          {t('view')}
        </a>
      </Button>
    </div>
  );
}
