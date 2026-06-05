import { isUsersMocked } from './auth-mode';

interface SessionUserLike {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  token?: string | null;
}

export function buildMockAuthToken(user: SessionUserLike | null | undefined, realModules?: string) {
  if (!isUsersMocked(realModules)) return null;
  if (!user?.id || !user.email) return null;
  return `mock:${user.id}:${encodeURIComponent(user.email)}:${encodeURIComponent(user.name ?? user.email)}`;
}

export function sessionAuthToken(user: SessionUserLike | null | undefined, realModules?: string) {
  return user?.token ?? buildMockAuthToken(user, realModules);
}
