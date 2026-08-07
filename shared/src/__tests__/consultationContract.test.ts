import { describe, it, expect } from 'vitest';
import { defaultConsultations } from '../cms/cmsDefaults';
import { mapCmsState } from '../api/cmsMapper';
import { makeDefaultCmsState } from '../cms/cmsDefaults';

/**
 * The contract between the backend's seeded consultation types and the app.
 *
 * The backend used to key these in English (`psychological`, `legal`, `family`,
 * `social`, `educational`) and type the consent box as `checkbox`. The app keys
 * consultation routes in Arabic, and renders `checkbox` from `options` — which
 * the consent field has none of — so an API-driven form would have shown a
 * REQUIRED agreement with nothing to tick.
 *
 * Nothing visibly broke, because `isFullFidelity()` rejects a type in that state
 * and the mapper falls back to the bundled form. The real cost was silent: no
 * consultation form edited in the dashboard could ever reach the app.
 *
 * T-07 reseeds the backend from `defaultConsultations`. These tests pin BOTH
 * halves of that: the old shape must still be rejected (the safety net stays),
 * and the new shape must be accepted (otherwise the fix bought nothing).
 */

const APP_KEYS = ['نفسية', 'دينية', 'طبية', 'أسرية', 'أعمال'];

/** The seed the backend now ships, expressed exactly as the API serves it. */
const seededFromShared = () =>
  defaultConsultations.map((c) => ({
    key: c.key,
    label: c.name,
    icon: c.icon,
    description: c.description,
    disclaimer: c.disclaimer,
    sortOrder: c.sortOrder,
    visible: c.visible,
    homeVisible: c.homeVisible,
    availableTimes: c.availableTimes,
    fields: c.fields.map((f) => ({ ...f })),
  }));

/** The shape the API served before T-07. */
const legacyApiTypes = () => [
  {
    key: 'psychological',
    label: 'استشارة نفسية',
    icon: 'brain',
    disclaimer: 'هذه الخدمة لا تغني عن زيارة طبيب متخصص.',
    fields: [
      { key: 'name', label: 'الاسم', type: 'text', required: true },
      { key: 'consent', label: 'أوافق على سياسة الخصوصية', type: 'checkbox', required: true },
    ],
  },
];

const mapWith = (consultations: unknown) =>
  mapCmsState({ ...(makeDefaultCmsState() as any), consultations } as any, makeDefaultCmsState());

describe('consultation type contract (backend seed ⇄ app forms)', () => {
  it('the app still routes by the five Arabic keys', () => {
    expect(defaultConsultations.map((c) => c.key)).toEqual(APP_KEYS);
  });

  it('every bundled type ends in a consent-typed, required field', () => {
    for (const c of defaultConsultations) {
      const consent = c.fields.find((f) => f.key === 'consent');
      expect(consent?.type).toBe('consent');
      expect(consent?.required).toBe(true);
    }
  });

  it('no choice field is unanswerable — every one carries options', () => {
    for (const c of defaultConsultations) {
      for (const f of c.fields) {
        if (['radio', 'checkbox', 'multiselect'].includes(f.type)) {
          expect(f.options?.length, `${c.key}.${f.key}`).toBeTruthy();
        }
      }
    }
  });

  describe('the mapper, given the NEW seed', () => {
    it('keeps all five types under the app keys', () => {
      const out = mapWith(seededFromShared());
      expect(out.consultations.map((c) => c.key)).toEqual(APP_KEYS);
    });

    it('takes the FORM from the API — the point of the fix', () => {
      // Prove the API form is adopted rather than silently replaced by the
      // bundled one: change a label server-side and require it to survive.
      const api = seededFromShared();
      api[0].fields = api[0].fields.map((f) =>
        f.key === 'summary' ? { ...f, label: 'صياغة عدّلها المسؤول' } : f,
      );
      const out = mapWith(api);
      const summary = out.consultations[0].fields.find((f) => f.key === 'summary');
      expect(summary?.label).toBe('صياغة عدّلها المسؤول');
    });

    it('still carries the consent field through to the rendered form', () => {
      const out = mapWith(seededFromShared());
      for (const c of out.consultations) {
        expect(c.fields.some((f) => f.type === 'consent' && f.required)).toBe(true);
      }
    });
  });

  describe('the mapper, given the OLD seed — the safety net must stay', () => {
    it('refuses the partial type as a form and falls back to the bundled one', () => {
      const out = mapWith(legacyApiTypes());
      const psych = out.consultations.find((c) => c.key === 'نفسية');
      expect(psych).toBeDefined();
      // Bundled form, not the two-field API one.
      expect(psych!.fields.length).toBeGreaterThan(2);
      expect(psych!.fields.some((f) => f.type === 'consent')).toBe(true);
    });

    it('never lets a checkbox-typed consent field reach the renderer', () => {
      const out = mapWith(legacyApiTypes());
      for (const c of out.consultations) {
        const consent = c.fields.find((f) => f.key === 'consent');
        if (consent) expect(consent.type).not.toBe('checkbox');
      }
    });
  });
});
