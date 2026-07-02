import { Guide } from '@/components/layout/guide';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Cómo comprar un dorsal',
  description:
    'Guía paso a paso para comprar un dorsal en dorsal.market con pago en custodia y cambio de titularidad verificado.',
};

export default async function ComoComprarPage() {
  const t = await getTranslations('guide_buy');
  return (
    <Guide
      eyebrow={t('eyebrow')}
      title={t('title')}
      intro={t('intro')}
      cta={{ href: '/', label: t('cta_label') }}
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
