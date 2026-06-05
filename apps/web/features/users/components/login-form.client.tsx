'use client';
import { Button } from '@/components/ui/button';
import { LogIn, UserRound } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm({
  cognitoEnabled,
  mockEnabled,
}: {
  cognitoEnabled: boolean;
  mockEnabled: boolean;
}) {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/perfil';
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function loginWithCognito() {
    setLoadingProvider('cognito');
    await signIn('cognito', { callbackUrl });
  }

  async function loginAsDemo() {
    setLoadingProvider('credentials');
    await signIn('credentials', {
      email: 'demo@dorsal.market',
      password: 'demo1234',
      callbackUrl,
    });
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-8">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Accede para comprar, vender y gestionar tus dorsales.
      </p>

      <div className="mt-6 space-y-3">
        {cognitoEnabled ? (
          <Button
            type="button"
            className="w-full"
            disabled={loadingProvider !== null}
            onClick={loginWithCognito}
          >
            <LogIn />
            Entrar con Cognito
          </Button>
        ) : (
          <div className="rounded-md border border-border bg-bg-elevated p-3 text-sm text-text-secondary">
            El login real se activara al configurar Cognito en el entorno.
          </div>
        )}

        {mockEnabled && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loadingProvider !== null}
            onClick={loginAsDemo}
          >
            <UserRound />
            Entrar como demo
          </Button>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{' '}
        <Link
          href={`/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-coral hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
