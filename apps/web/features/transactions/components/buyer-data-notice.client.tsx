'use client';
import { Button } from '@/components/ui/button';
import {
  canBuyWithProfile,
  getMissingProfileFields,
} from '@/features/users/lib/profile-completion';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@dorsal/schemas';
import { IdCard } from 'lucide-react';
import Link from 'next/link';

export function BuyerDataNotice({
  isAuthenticated,
  isLoading = false,
  profile,
}: {
  isAuthenticated: boolean;
  isLoading?: boolean;
  profile?: UserProfile | null | undefined;
}) {
  const t = useTranslations('buyer_data');
  const isComplete = canBuyWithProfile(profile);
  const missingFields = getMissingProfileFields(profile);

  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <div className="flex items-start gap-3">
        <IdCard className="mt-0.5 h-5 w-5 text-coral" />
        <div className="min-w-0">
          <h2 className="font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('description')}</p>
          {!isAuthenticated && (
            <p className="mt-2 text-sm text-text-muted">{t('need_login')}</p>
          )}
          {isAuthenticated && isLoading && (
            <p className="mt-2 text-sm text-text-muted">{t('checking')}</p>
          )}
          {isAuthenticated && !isLoading && !isComplete && (
            <p className="mt-2 text-sm text-text-muted">
              {missingFields.length
                ? t('complete_with_fields', { fields: missingFields.join(', ') })
                : t('complete_pending')}
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href={isComplete ? '/perfil' : '/perfil/completar'}>{t('review_profile')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
