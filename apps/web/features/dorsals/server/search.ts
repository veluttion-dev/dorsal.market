import 'server-only';
import { getServerApi } from '@/lib/api';
import type { SearchDorsalsQuery } from '@dorsal/schemas';

export async function searchDorsals(query: SearchDorsalsQuery) {
  const api = await getServerApi();
  return api.dorsals.search(query);
}
