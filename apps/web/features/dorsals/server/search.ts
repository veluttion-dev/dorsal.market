import 'server-only';
import type { SearchDorsalsQuery } from '@dorsal/schemas';
import { getServerApi } from '@/lib/api';

export async function searchDorsals(query: SearchDorsalsQuery) {
  const api = await getServerApi();
  return api.dorsals.search(query);
}
