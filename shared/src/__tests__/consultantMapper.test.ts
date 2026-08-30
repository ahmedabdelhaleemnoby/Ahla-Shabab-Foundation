import { describe, it, expect } from 'vitest';
import { mapConsultant } from '../api/mappers';

/*
 * Regression cover for a crash that shipped in v1.7.0 and took out the whole
 * الاستشارات tab.
 *
 * `mapConsultant` hard-coded `featured: false`, so NO consultant coming from
 * the API could ever be featured. `ConsultationsScreen` then did
 *
 *     const featured = getConsultants().find((c) => c.featured)!
 *
 * and dereferenced `featured.name`. The non-null assertion silenced the one
 * compiler error that would have caught it. Offline the bundled data marks a
 * consultant featured, so the screen worked in every local run; it crashed on
 * the emulator the first time the live API answered.
 *
 * The screen is defensive now, but the flag has to survive the mapper too —
 * otherwise "mark a consultant as featured" in the dashboard does nothing.
 */

/** Shaped after a real GET /providers row from production. */
const row = {
  id: 'provider-2',
  name: 'أ. فاطمة حسن',
  specialization: 'أخصائية اجتماعية',
  yearsExperience: 10,
  sessions: 0,
  rating: 4.9,
  reviews: 89,
  avatarUrl: null,
  featured: false,
  active: true,
  acceptingBookings: true,
  _count: { services: 1, bookings: 3 },
};

describe('mapConsultant', () => {
  it('carries a featured provider through as featured', () => {
    expect(mapConsultant({ ...row, featured: true }).featured).toBe(true);
  });

  it('leaves a non-featured provider non-featured', () => {
    expect(mapConsultant(row).featured).toBe(false);
  });

  it('treats a payload with no featured field as not featured', () => {
    const { featured, ...withoutFlag } = row;
    expect(mapConsultant(withoutFlag).featured).toBe(false);
  });

  it('prefers the authored session count over the booking count', () => {
    expect(mapConsultant({ ...row, sessions: 42 }).sessions).toBe(42);
  });

  it('falls back to the booking count when sessions is absent', () => {
    const { sessions, ...withoutSessions } = row;
    expect(mapConsultant(withoutSessions).sessions).toBe(3);
  });

  it('maps the fields the consultant card renders', () => {
    const c = mapConsultant(row);
    expect(c.name).toBe('أ. فاطمة حسن');
    expect(c.specialty).toBe('أخصائية اجتماعية');
    expect(c.yearsExperience).toBe(10);
    expect(c.rating).toBe(4.9);
    expect(c.reviews).toBe(89);
  });
});
