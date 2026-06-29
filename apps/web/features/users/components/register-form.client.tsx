'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import type { Gender } from '@dorsal/schemas';
import { LogIn, UserPlus } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_CALLBACK = '/perfil/completar';

export function RegisterForm({
  cognitoEnabled,
  mockEnabled,
}: {
  cognitoEnabled: boolean;
  mockEnabled: boolean;
}) {
  const t = useTranslations('auth');
  const api = useApi();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? DEFAULT_CALLBACK;
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');

  async function createWithCognito() {
    setSubmitting(true);
    await signIn('cognito', { callbackUrl }, { screen_hint: 'signup' });
  }

  async function createMockUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await api.users.register({
        full_name: fullName.trim(),
        email: email.trim(),
        dni: dni.trim(),
        gender,
        birth_date: birthDate,
        password,
      });
      await signIn('credentials', {
        email: user.email,
        password,
        dev_user_id: user.id,
        dev_name: user.name,
        callbackUrl,
      });
    } catch {
      setSubmitting(false);
      toast.error(t('register_error'));
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-bg-card p-8">
      <h1 className="text-2xl font-bold">{t('register_title')}</h1>
      <p className="mt-2 text-sm text-text-secondary">{t('register_subtitle')}</p>

      {cognitoEnabled && (
        <Button
          type="button"
          className="mt-6 w-full"
          disabled={submitting}
          onClick={createWithCognito}
        >
          <LogIn />
          {t('register_cognito')}
        </Button>
      )}

      {mockEnabled && (
        <form className="mt-6 space-y-4" onSubmit={createMockUser}>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">{t('label_full_name')}</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('label_email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dni">{t('label_dni')}</Label>
            <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">{t('label_gender')}</Label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <option value="female">{t('gender_female')}</option>
              <option value="male">{t('gender_male')}</option>
              <option value="other">{t('gender_other')}</option>
              <option value="prefer_not_to_say">{t('gender_prefer_not')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">{t('label_birth_date')}</Label>
            <Input
              id="birth_date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('label_password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <UserPlus />
            {t('register_demo')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('have_account')}{' '}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-coral hover:underline"
        >
          {t('enter_link')}
        </Link>
      </p>
    </div>
  );
}
