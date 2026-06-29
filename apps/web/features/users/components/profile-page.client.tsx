'use client';
import { ProfileForm } from '@/features/users/components/profile-form.client';
import { useMe } from '@/features/users/hooks/use-me';
import { usePatchProfile } from '@/features/users/hooks/use-patch-profile';
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
          if (completeMode && updated.profile_complete && updated.runner_data_complete) {
            router.push(params.get('callbackUrl') ?? '/perfil');
          }
        }}
      />
    </div>
  );
}
