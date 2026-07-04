import type { PublishDorsalInput } from '@dorsal/schemas';
import type { z } from 'zod';

export const PUBLISH_DRAFT_STORAGE_KEY = 'dorsal.market.publish-draft.v1';

type PublishDraft = Partial<z.input<typeof PublishDorsalInput>>;

function getPublishDraftStorageKey(ownerId?: string | null) {
  const normalizedOwnerId = ownerId?.trim();
  return normalizedOwnerId
    ? `${PUBLISH_DRAFT_STORAGE_KEY}.${encodeURIComponent(normalizedOwnerId)}`
    : PUBLISH_DRAFT_STORAGE_KEY;
}

export function loadPublishDraft(ownerId?: string | null): PublishDraft | null {
  if (typeof window === 'undefined') return null;
  const key = getPublishDraftStorageKey(ownerId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublishDraft;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function savePublishDraft(value: unknown, ownerId?: string | null) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getPublishDraftStorageKey(ownerId), JSON.stringify(value));
}

export function clearPublishDraft(ownerId?: string | null) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getPublishDraftStorageKey(ownerId));
}
