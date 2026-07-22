'use client';
import { sessionAuthToken } from '@/features/users/lib/mock-auth-token';
import { createApi } from '@dorsal/api-client';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useApi() {
  const { data } = useSession();
  const user = data?.user;
  return useMemo(
    () =>
      createApi({
        baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL as string,
        getUserId: () => user?.id ?? null,
        getAuthToken: () => sessionAuthToken(user, process.env.NEXT_PUBLIC_REAL_API_MODULES),
        realModules: process.env.NEXT_PUBLIC_REAL_API_MODULES,
      }),
    [user],
  );
}
