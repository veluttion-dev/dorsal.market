import { Guide } from '@/components/layout/guide';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo comprar un dorsal',
  description:
    'Guía paso a paso para comprar un dorsal en dorsal.market con pago en custodia y cambio de titularidad verificado.',
};

export default function ComoComprarPage() {
  return (
    <Guide
      eyebrow="Guía de compra"
      title="Cómo comprar un dorsal"
      intro="Comprar es seguro: tu dinero queda en custodia y no se libera hasta que confirmas que el dorsal está a tu nombre."
      cta={{ href: '/', label: 'Explorar dorsales' }}
      steps={[
        {
          title: 'Crea tu cuenta y completa tus datos de corredor',
          body: 'El cambio de titularidad requiere tus datos reales (nombre, DNI, talla, tiempo estimado…). Sin el perfil de corredor completo no podrás comprar.',
        },
        {
          title: 'Explora y filtra dorsales',
          body: 'Busca por carrera, distancia, precio, ubicación o método de pago. Los filtros se aplican al instante.',
        },
        {
          title: 'Reserva y paga',
          body: 'Al comprar, el importe se retiene en custodia (escrow). El vendedor todavía no recibe el dinero.',
        },
        {
          title: 'El vendedor realiza el cambio',
          body: 'Con tus datos, el vendedor tramita el cambio de titularidad con la organización de la carrera y sube la prueba.',
        },
        {
          title: 'Confirma el cambio',
          body: 'Revisa que el dorsal ya está a tu nombre y confírmalo. Puedes seguir el estado de la operación en todo momento.',
        },
        {
          title: 'Se liberan los fondos y valoras',
          body: 'Al confirmar, el dinero se libera al vendedor y puedes dejar tu valoración de la operación.',
        },
        {
          title: '¿Algo no encaja? Abre una disputa',
          body: 'Si el cambio no se completa correctamente, abre una disputa y se gestiona el reembolso de tu dinero en custodia.',
        },
      ]}
    />
  );
}
