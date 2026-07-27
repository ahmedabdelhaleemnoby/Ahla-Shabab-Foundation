import { describe, it, expect } from 'vitest';
import {
  makeDefaultCmsState,
  CMS_SCHEMA_VERSION,
  defaultMenu,
  defaultHome,
  defaultPages,
  defaultMedia,
} from '../cms';
import { foundationStats, paymentMethods } from '../data';

describe('CMS defaults', () => {
  it('builds a valid default state at the current schema version', () => {
    const s = makeDefaultCmsState();
    expect(s.version).toBe(CMS_SCHEMA_VERSION);
    expect(Array.isArray(s.menu)).toBe(true);
    expect(Array.isArray(s.home)).toBe(true);
    expect(Array.isArray(s.pages)).toBe(true);
    expect(s.menu.length).toBeGreaterThan(0);
    expect(s.home.length).toBeGreaterThan(0);
    expect(s.pages.length).toBeGreaterThan(0);
  });

  it('returns a fresh deep copy each call (no shared references)', () => {
    const a = makeDefaultCmsState();
    const b = makeDefaultCmsState();
    a.home[0].visible = false;
    a.settings.appName = 'changed';
    expect(b.home[0].visible).toBe(true);
    expect(b.settings.appName).not.toBe('changed');
  });

  it('always keeps Home reachable and visible by default', () => {
    const home = defaultMenu.flatMap((g) => g.items).find((i) => i.id === 'm-home');
    expect(home).toBeTruthy();
    expect(home!.visible).toBe(true);
    expect(home!.target).toEqual({ kind: 'tab', tab: 'Home' });
  });

  it('home sections have unique ids and contiguous ordering', () => {
    const ids = new Set(defaultHome.map((s) => s.id));
    expect(ids.size).toBe(defaultHome.length);
    const orders = defaultHome.map((s) => s.sortOrder).sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    expect(orders[orders.length - 1]).toBe(defaultHome.length - 1);
  });

  it('every page has a unique slug', () => {
    const slugs = defaultPages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('account-only pages are flagged loginRequired', () => {
    const byId = (s: string) => defaultPages.find((p) => p.slug === s)!;
    expect(byId('Receipts').loginRequired).toBe(true);
    expect(byId('MyBookings').loginRequired).toBe(true);
    expect(byId('Home').loginRequired).toBe(false);
  });

  it('seeds a non-empty media library with valid src + unique ids', () => {
    const s = makeDefaultCmsState();
    expect(s.media.length).toBeGreaterThan(0);
    expect(new Set(s.media.map((m) => m.id)).size).toBe(s.media.length);
    for (const m of defaultMedia) {
      expect(m.src.startsWith('data:image/')).toBe(true);
      expect(m.sizeBytes).toBeGreaterThan(0);
    }
  });

  it('is at schema v5 and deep-copies media + consultations', () => {
    expect(CMS_SCHEMA_VERSION).toBe(5);
    const a = makeDefaultCmsState();
    const b = makeDefaultCmsState();
    a.media[0].title = 'x';
    a.consultations[0].fields[0].label = 'y';
    expect(b.media[0].title).not.toBe('x');
    expect(b.consultations[0].fields[0].label).not.toBe('y');
  });

  // v4 moved the About-screen impact figures into CMS settings so the dashboard
  // editor actually reaches the app (D-08).
  it('seeds editable impact stats in settings, copied per instance', () => {
    const s = makeDefaultCmsState();
    expect(s.settings.stats.beneficiaries).toBe(foundationStats.beneficiaries);
    expect(s.settings.stats.yearsOfService).toBe(String(foundationStats.yearsOfService));
    expect(s.settings.stats.governorates).toBe(String(foundationStats.governorates));

    const other = makeDefaultCmsState();
    s.settings.stats.beneficiaries = 'changed';
    expect(other.settings.stats.beneficiaries).not.toBe('changed');
  });

  // v5 made payment methods an editable CMS slice so the dashboard's
  // وسائل الدفع card reaches the app's Donate screen (D-17).
  it('seeds payment methods as an editable slice, copied per instance', () => {
    const s = makeDefaultCmsState();
    expect(s.paymentMethods.length).toBe(paymentMethods.length);
    expect(new Set(s.paymentMethods.map((m) => m.id)).size).toBe(s.paymentMethods.length);

    const other = makeDefaultCmsState();
    s.paymentMethods[0].availability = 'غير متاحة حالياً';
    expect(other.paymentMethods[0].availability).not.toBe('غير متاحة حالياً');
  });

  // Every field the dashboard Settings page edits must exist on CmsSettings,
  // or the save silently drops it (D-17).
  it('exposes every dashboard-editable settings field', () => {
    const s = makeDefaultCmsState().settings;
    for (const k of ['heroTitle', 'heroSubtitle', 'hotline', 'email', 'address', 'workingHours', 'website', 'zakatNisabEgp'] as const) {
      expect(s[k], `settings.${k} missing`).toBeDefined();
    }
    for (const k of ['facebook', 'instagram', 'youtube', 'twitter'] as const) {
      expect(s.socials[k], `socials.${k} missing`).toBeDefined();
    }
  });

  // The email is the identity key linking a returning guest's requests (D-09).
  it('marks the consultation email field required on every type', () => {
    for (const type of makeDefaultCmsState().consultations) {
      const email = type.fields.find((f) => f.key === 'email');
      expect(email, `${type.key} has no email field`).toBeDefined();
      expect(email!.required, `${type.key} email is optional`).toBe(true);
    }
  });

  it('seeds a generic content page with well-formed rich blocks', () => {
    const s = makeDefaultCmsState();
    const pg = s.pages.find((p) => p.slug === 'success-stories');
    expect(pg).toBeTruthy();
    expect(pg!.builtin).toBe(false);
    expect(pg!.template).not.toBe('native');
    const blocks = pg!.content ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    // unique ids + contiguous ordering
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
    const orders = blocks.map((b) => b.sortOrder).sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    // list blocks carry items; cta carries a target
    for (const b of blocks) {
      if (b.type === 'bulletList' || b.type === 'orderedList') expect((b.items ?? []).length).toBeGreaterThan(0);
      if (b.type === 'cta') expect(b.ctaTarget).toBeTruthy();
    }
  });

  it('seeds 5 consultation types, each with a valid form schema', () => {
    const s = makeDefaultCmsState();
    expect(s.consultations.length).toBe(5);
    for (const c of s.consultations) {
      expect(c.fields.length).toBeGreaterThan(0);
      // every field has a unique key + a required consent + a name field
      const keys = c.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys).toContain('name');
      expect(c.fields.some((f) => f.type === 'consent' && f.required)).toBe(true);
      // radio/checkbox fields must carry options
      for (const f of c.fields) {
        if (f.type === 'radio' || f.type === 'checkbox' || f.type === 'multiselect') {
          expect((f.options ?? []).length).toBeGreaterThan(0);
        }
      }
    }
  });
});
