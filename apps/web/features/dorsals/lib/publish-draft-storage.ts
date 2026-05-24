import type { PublishDorsalInput } from '@dorsal/schemas';
import type { z } from 'zod';

export const PUBLISH_DRAFT_STORAGE_KEY = 'dorsal.market.publish-draft.v1';

type PublishDraft = Partial<z.input<typeof PublishDorsalInput>>;

export function loadPublishDraft(): PublishDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublishDraft;
  } catch {
    window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function savePublishDraft(value: unknown) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUBLISH_DRAFT_STORAGE_KEY, JSON.stringify(value));
}

export function clearPublishDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
}
