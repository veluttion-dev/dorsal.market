import 'server-only';
import { sessionAuthToken } from '@/features/users/lib/mock-auth-token';
import { createApi } from '@dorsal/api-client';
import { auth } from './auth';
import { env } from './env';

export async function getServerApi() {
  const session = await auth();
  return createApi({
    baseUrl: env.BACKEND_API_URL,
    getUserId: () => session?.user?.id ?? null,
    getAuthToken: () => sessionAuthToken(session?.user, env.NEXT_PUBLIC_REAL_API_MODULES),
    realModules: env.NEXT_PUBLIC_REAL_API_MODULES,
  });
}
