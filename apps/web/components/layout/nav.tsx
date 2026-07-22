import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { NotificationBell } from '../notifications/notification-bell.client';
import { NavMobile } from './nav-mobile.client';
import { SignOutButton } from './sign-out-button.client';
import { ThemeToggle } from './theme-toggle';

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="dorsal.market — inicio">
      <span className="rounded-md border-2 border-coral px-2 py-0.5 font-mono text-base font-bold tracking-tight">
        dorsal<span className="text-coral">.</span>market
      </span>
    </Link>
  );
}

const NAV_LINK =
  'relative text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-coral after:transition-all after:content-[""] hover:after:w-full';

export async function Nav({
  session,
}: {
  session?: { user?: { name?: string | null } } | null;
}) {
  const t = await getTranslations('nav');

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-secondary/90 shadow-card backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Brand />

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/vender" className={NAV_LINK}>
            {t('sell')}
          </Link>
          <ThemeToggle />
          {session?.user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link href="/perfil">
                <Button variant="secondary" size="sm">
                  {session.user.name ?? t('profile')}
                </Button>
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/registro" className={NAV_LINK}>
                {t('create_account')}
              </Link>
              <Link href="/login">
                <Button size="sm">{t('enter')}</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <NavMobile session={session} />
        </div>
      </div>
    </nav>
  );
}
