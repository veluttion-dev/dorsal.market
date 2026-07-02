import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function NotFound() {
  const t = await getTranslations('not_found');
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">{t('heading')}</h1>
        <p className="text-text-secondary">{t('message')}</p>
        <Link href="/" className="text-coral hover:underline">
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
