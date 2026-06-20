import { permanentRedirect } from 'next/navigation';

// El listado de dorsales vive ahora en la home ('/'). Mantenemos /dorsales como
// redirección permanente para no romper enlaces antiguos ni SEO. El detalle
// sigue en /dorsales/[id].
export default function DorsalesPage() {
  permanentRedirect('/');
}
