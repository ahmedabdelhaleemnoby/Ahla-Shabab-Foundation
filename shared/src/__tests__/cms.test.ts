import { describe, it, expect } from 'vitest';
import {
  makeDefaultCmsState,
  CMS_SCHEMA_VERSION,
  defaultMenu,
  defaultHome,
  defaultPages,
  defaultMedia,
} from '../cms';

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

  it('is at schema v3 and deep-copies media + consultations', () => {
    expect(CMS_SCHEMA_VERSION).toBe(3);
    const a = makeDefaultCmsState();
    const b = makeDefaultCmsState();
    a.media[0].title = 'x';
    a.consultations[0].fields[0].label = 'y';
    expect(b.media[0].title).not.toBe('x');
    expect(b.consultations[0].fields[0].label).not.toBe('y');
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
