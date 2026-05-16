import 'server-only';
import { getServerApi } from '@/lib/api';
import { NotFoundError } from '@dorsal/api-client';

export async function getDorsalDetail(id: string) {
  const api = await getServerApi();
  try {
    return await api.dorsals.getById(id);
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}
