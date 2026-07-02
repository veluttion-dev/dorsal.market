import { auth } from '@/lib/auth';
import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Nav } from './nav';

/** Nav + footer shell shared by the browsable route groups (marketing, app). */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-dvh flex-col">
      {/* firma coral del sitio */}
      <div className="h-1 bg-coral" />
      <Nav session={session} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
