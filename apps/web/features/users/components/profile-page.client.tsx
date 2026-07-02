'use client';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/features/users/components/profile-form.client';
import { useMe } from '@/features/users/hooks/use-me';
import { usePatchProfile } from '@/features/users/hooks/use-patch-profile';
import { isSessionAuthError } from '@/features/users/lib/session-errors';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function ProfilePage({ completeMode = false }: { completeMode?: boolean }) {
  const t = useTranslations('profile');
  const me = useMe();
  const patch = usePatchProfile();
  const router = useRouter();
  const params = useSearchParams();

  if (me.isLoading) {
    return <p className="text-sm text-text-secondary">{t('loading')}</p>;
  }

  if (isSessionAuthError(me.error)) {
    const target = completeMode ? '/perfil/completar' : '/perfil';
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(target)}`;
    return (
      <div role="alert" className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
        <div>
          <h1 className="text-2xl font-semibold">{t('session_expired_title')}</h1>
          <p className="mt-2 text-sm text-text-secondary">{t('session_expired_body')}</p>
        </div>
        <Button type="button" onClick={() => signOut({ callbackUrl: loginUrl })}>
          {t('session_expired_cta')}
        </Button>
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <p className="text-sm text-red-500">{t('load_error')}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{completeMode ? t('complete_title') : t('title')}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
      </div>
      <ProfileForm
        user={me.data}
        onSubmit={async (input) => {
          const updated = await patch.mutateAsync(input);
          toast.success(t('saved_toast'));
          if (completeMode && updated.profile_complete) {
            router.push(params.get('callbackUrl') ?? '/perfil');
          }
        }}
      />
    </div>
  );
}
