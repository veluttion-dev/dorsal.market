import { LoginForm } from '@/features/users/components/login-form.client';
import { isUsersMocked } from '@/features/users/lib/auth-mode';
import { Suspense } from 'react';

export default function Page() {
  const cognitoEnabled = Boolean(process.env.AUTH_COGNITO_ID && process.env.AUTH_COGNITO_ISSUER);
  const mockEnabled =
    process.env.NODE_ENV === 'development' &&
    isUsersMocked(process.env.NEXT_PUBLIC_REAL_API_MODULES);

  return (
    <Suspense fallback={null}>
      <LoginForm cognitoEnabled={cognitoEnabled} mockEnabled={mockEnabled} />
    </Suspense>
  );
}
