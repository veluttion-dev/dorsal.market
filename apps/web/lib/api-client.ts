'use client';
import { createApi } from '@dorsal/api-client';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useApi() {
  const { data } = useSession();
  return useMemo(
    () =>
      createApi({
        baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL as string,
        getUserId: () => data?.user?.id ?? null,
      }),
    [data?.user?.id],
  );
}
