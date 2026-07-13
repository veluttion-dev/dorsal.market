import { beforeEach, describe, expect, it } from 'vitest';
import {
  PUBLISH_DRAFT_STORAGE_KEY,
  clearPublishDraft,
  loadPublishDraft,
  savePublishDraft,
} from '../publish-draft-storage';

describe('publish draft storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads form-shaped draft values', () => {
    savePublishDraft({
      publish: true,
      photo_url: 'https://example.com/photo.jpg',
      race_name: 'Media Madrid',
      bib_number: '42',
      race_date: '2027-04-12',
      location: 'Madrid',
      distance: '21k',
      start_corral: 'B',
      included_items: { chip: true, shirt: false, bag: false, medal: true, refreshments: true },
      purchase_requirements: {
        requires_estimated_time: true,
        requires_shirt_size: false,
        requires_emergency_contact: true,
        fixed_shirt_size: null,
      },
      price_amount: 45,
      contact: { phone: '600000000', email: null, phone_visible: true, email_visible: true },
      sale_reason: 'Viaje de trabajo',
    });

    expect(loadPublishDraft()?.race_name).toBe('Media Madrid');
    expect(loadPublishDraft()?.purchase_requirements?.requires_estimated_time).toBe(true);
    expect(localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY)).toContain('Media Madrid');
  });

  it('drops legacy payment methods when loading old drafts', () => {
    localStorage.setItem(
      PUBLISH_DRAFT_STORAGE_KEY,
      JSON.stringify({
        publish: true,
        race_name: 'Carrera antigua',
        payment_methods: ['bizum'],
      }),
    );

    expect(loadPublishDraft()).toEqual({
      publish: true,
      race_name: 'Carrera antigua',
    });
  });

  it('keeps saved drafts isolated by owner', () => {
    savePublishDraft({ publish: true, race_name: 'Cuenta antigua' }, 'seller-old');
    savePublishDraft({ publish: true, race_name: 'Cuenta actual' }, 'seller-current');

    expect(loadPublishDraft('seller-old')?.race_name).toBe('Cuenta antigua');
    expect(loadPublishDraft('seller-current')?.race_name).toBe('Cuenta actual');
    expect(loadPublishDraft('seller-new')).toBeNull();
  });

  it('returns null and clears corrupted local storage', () => {
    localStorage.setItem(PUBLISH_DRAFT_STORAGE_KEY, '{bad json');

    expect(loadPublishDraft()).toBeNull();
    expect(localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears the saved draft', () => {
    savePublishDraft({ publish: true, photo_url: 'https://example.com/photo.jpg' });

    clearPublishDraft();

    expect(loadPublishDraft()).toBeNull();
  });
});
