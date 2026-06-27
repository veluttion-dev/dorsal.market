import Link from 'next/link';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Plataforma',
    links: [
      { href: '/', label: 'Explorar dorsales' },
      { href: '/vender', label: 'Vender un dorsal' },
    ],
  },
  {
    title: 'Guías',
    links: [
      { href: '/guias/comprar', label: 'Cómo comprar un dorsal' },
      { href: '/guias/vender', label: 'Cómo publicar un dorsal' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { href: '/login', label: 'Iniciar sesión' },
      { href: '/registro', label: 'Crear cuenta' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-coral/60 bg-bg-secondary">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <span className="inline-block rounded-md border-2 border-coral px-2 py-0.5 font-mono text-sm font-bold tracking-tight">
            dorsal<span className="text-coral">.</span>market
          </span>
          <p className="max-w-xs text-sm text-text-secondary">
            Compra y vende dorsales de carreras populares con pago en custodia. Hecho para
            corredores.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {col.title}
            </h2>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-coral"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} dorsal.market · Desarrollado por{' '}
            <a
              href="https://veluttion.es"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text-secondary transition-colors hover:text-coral"
            >
              Veluttion
            </a>
          </p>
          <p>Pago en custodia · Cambios de titularidad verificados</p>
        </div>
      </div>
    </footer>
  );
}
