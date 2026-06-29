import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function Footer() {
  const t = await getTranslations('footer');

  const COLUMNS = [
    {
      title: t('col_platform'),
      links: [
        { href: '/', label: t('link_explore') },
        { href: '/vender', label: t('link_sell') },
      ],
    },
    {
      title: t('col_guides'),
      links: [
        { href: '/guias/comprar', label: t('link_guide_buy') },
        { href: '/guias/vender', label: t('link_guide_sell') },
      ],
    },
    {
      title: t('col_account'),
      links: [
        { href: '/login', label: t('link_login') },
        { href: '/registro', label: t('link_register') },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t-2 border-coral/60 bg-bg-secondary">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <span className="inline-block rounded-md border-2 border-coral px-2 py-0.5 font-mono text-sm font-bold tracking-tight">
            dorsal<span className="text-coral">.</span>market
          </span>
          <p className="max-w-xs text-sm text-text-secondary">{t('tagline')}</p>
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
            {t('copyright', { year: new Date().getFullYear() })}{' '}
            <a
              href="https://veluttion.es"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text-secondary transition-colors hover:text-coral"
            >
              Veluttion
            </a>
          </p>
          <p>{t('trust')}</p>
        </div>
      </div>
    </footer>
  );
}
