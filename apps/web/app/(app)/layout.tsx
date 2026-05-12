import type { ReactNode } from 'react';
import { Nav } from '@/components/layout/nav';
import { auth } from '@/lib/auth';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <>
      <Nav session={session} />
      {children}
    </>
  );
}
