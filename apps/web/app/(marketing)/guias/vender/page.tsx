import { Guide } from '@/components/layout/guide';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo publicar un dorsal',
  description:
    'Guía paso a paso para vender tu dorsal en dorsal.market: publica, gestiona el cambio de titularidad y cobra de forma segura.',
};

export default async function ComoVenderPage() {
  const t = await getTranslations('guide_sell');
  return (
    <Guide
      eyebrow={t('eyebrow')}
      title={t('title')}
      intro={t('intro')}
      cta={{ href: '/vender', label: t('cta_label') }}
      steps={[
        { title: t('step1_title'), body: t('step1_body') },
        { title: t('step2_title'), body: t('step2_body') },
        { title: t('step3_title'), body: t('step3_body') },
        { title: t('step4_title'), body: t('step4_body') },
        { title: t('step5_title'), body: t('step5_body') },
        { title: t('step6_title'), body: t('step6_body') },
        { title: t('step7_title'), body: t('step7_body') },
      ]}
    />
  );
}
