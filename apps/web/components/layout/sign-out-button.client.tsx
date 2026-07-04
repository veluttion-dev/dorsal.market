'use client';
import { Button } from '@/components/ui/button';
import { buildLocalCognitoLogoutPath } from '@/lib/cognito-logout';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function SignOutButton() {
  const t = useTranslations('nav');
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    await signOut({ callbackUrl: buildLocalCognitoLogoutPath('/') });
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={submit}>
      <LogOut />
      {t('sign_out')}
    </Button>
  );
}
