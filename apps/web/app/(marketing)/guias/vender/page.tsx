import { Guide } from '@/components/layout/guide';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo publicar un dorsal',
  description:
    'Guía paso a paso para vender tu dorsal en dorsal.market: publica, gestiona el cambio de titularidad y cobra de forma segura.',
};

export default function ComoVenderPage() {
  return (
    <Guide
      eyebrow="Guía de venta"
      title="Cómo publicar un dorsal"
      intro="Vende el dorsal que no vas a usar. El comprador paga por adelantado a una cuenta en custodia y tú cobras cuando confirma el cambio."
      cta={{ href: '/vender', label: 'Publicar un dorsal' }}
      steps={[
        {
          title: 'Crea tu cuenta',
          body: 'Regístrate y verifica tu identidad para poder vender en la plataforma.',
        },
        {
          title: 'Activa los cobros',
          body: 'Conecta tu método de cobro (onboarding de pagos) para poder recibir el dinero de forma segura cuando vendas.',
        },
        {
          title: 'Publica el dorsal',
          body: 'Sube una foto y completa los datos: carrera, fecha, distancia, precio, métodos de pago aceptados y qué incluye (chip, camiseta, medalla…).',
        },
        {
          title: 'Recibe una reserva',
          body: 'Cuando alguien compra, su pago queda retenido en custodia y recibes sus datos de corredor para el cambio.',
        },
        {
          title: 'Realiza el cambio de titularidad',
          body: 'Tramita el cambio con la organización de la carrera usando los datos del comprador.',
        },
        {
          title: 'Sube la prueba',
          body: 'Adjunta el justificante del cambio para que el comprador pueda verificar que el dorsal ya es suyo.',
        },
        {
          title: 'Cobra',
          body: 'Cuando el comprador confirma el cambio, los fondos retenidos en custodia se liberan a tu cuenta.',
        },
      ]}
    />
  );
}
