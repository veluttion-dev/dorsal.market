import 'server-only';
import { createApi } from '@dorsal/api-client';
import { auth } from './auth';
import { env } from './env';

export async function getServerApi() {
  const session = await auth();
  return createApi({
    baseUrl: env.BACKEND_API_URL,
    getUserId: () => session?.user?.id ?? null,
  });
}
