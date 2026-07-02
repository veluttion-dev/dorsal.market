'use client';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/features/users/components/profile-form.client';
import { useMe } from '@/features/users/hooks/use-me';
import { usePatchProfile } from '@/features/users/hooks/use-patch-profile';
import { isSessionAuthError } from '@/features/users/lib/session-errors';
import { signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function ProfilePage({ completeMode = false }: { completeMode?: boolean }) {
  const me = useMe();
  const patch = usePatchProfile();
  const router = useRouter();
  const params = useSearchParams();

  if (me.isLoading) {
    return <p className="text-sm text-text-secondary">Cargando perfil...</p>;
  }

  if (isSessionAuthError(me.error)) {
    const target = completeMode ? '/perfil/completar' : '/perfil';
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(target)}`;
    return (
      <div role="alert" className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
        <div>
          <h1 className="text-2xl font-semibold">Tu sesion ha caducado</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Vuelve a iniciar sesion para cargar tu perfil con un token valido.
          </p>
        </div>
        <Button type="button" onClick={() => signOut({ callbackUrl: loginUrl })}>
          Volver a iniciar sesion
        </Button>
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <p className="text-sm text-red-500">No se pudo cargar el perfil.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{completeMode ? 'Completar perfil' : 'Perfil'}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Guarda aquí tus datos personales. Los datos específicos de cada carrera se pedirán al
          comprar.
        </p>
      </div>
      <ProfileForm
        user={me.data}
        onSubmit={async (input) => {
          const updated = await patch.mutateAsync(input);
          toast.success('Perfil guardado');
          if (completeMode && updated.profile_complete) {
            router.push(params.get('callbackUrl') ?? '/perfil');
          }
        }}
      />
    </div>
  );
}
