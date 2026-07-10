import { describe, it, expect } from 'vitest';
import {
  isEgPhone,
  isEmail,
  initialDonationStatus,
  isMethodUsable,
  isValidDonationAmount,
} from '../rules';
import { paymentMethods, cases, projects } from '../data';
import { providers, buildAvailableDays, makeBookingRef } from '../services';
import type { PaymentMethod } from '../types';

/* ───────────── Donation security rules ───────────── */
describe('donation status rules', () => {
  it('manual methods (bank transfer / InstaPay) default to قيد المراجعة (admin approval required)', () => {
    expect(initialDonationStatus('تحويل بنكي')).toBe('قيد المراجعة');
    expect(initialDonationStatus('إنستاباي')).toBe('قيد المراجعة');
  });

  it('gateway methods default to قيد التأكيد (server callback required)', () => {
    expect(initialDonationStatus('بطاقة بنكية')).toBe('قيد التأكيد');
    expect(initialDonationStatus('فوري')).toBe('قيد التأكيد');
  });

  it('the client can NEVER produce مكتمل for any method', () => {
    for (const m of paymentMethods) {
      expect(initialDonationStatus(m.id)).not.toBe('مكتمل');
      expect(['قيد التأكيد', 'قيد المراجعة']).toContain(initialDonationStatus(m.id));
    }
  });

  it('the ClientDonationStatus type excludes مكتمل at compile time', () => {
    // @ts-expect-error — 'مكتمل' is not assignable to ClientDonationStatus
    const bad: ReturnType<typeof initialDonationStatus> = 'مكتمل';
    void bad;
  });

  it('unavailable methods cannot be used (فودافون كاش is قيد التفعيل)', () => {
    expect(isMethodUsable('فودافون كاش')).toBe(false);
    expect(isMethodUsable('بطاقة بنكية')).toBe(true);
  });

  it('every payment method has a valid availability + manual flag', () => {
    for (const m of paymentMethods) {
      expect(['متاحة', 'قيد التفعيل', 'غير متاحة حالياً']).toContain(m.availability);
      expect(typeof m.manual).toBe('boolean');
    }
    // every manual method must be a transfer-family method
    for (const m of paymentMethods.filter((x) => x.manual)) {
      expect(m.group).toBe('تحويل بنكي');
    }
  });

  it('donation amount validation rejects zero, negatives, floats, and absurd values', () => {
    expect(isValidDonationAmount('500')).toBe(true);
    expect(isValidDonationAmount(5)).toBe(true);
    expect(isValidDonationAmount('0')).toBe(false);
    expect(isValidDonationAmount('-50')).toBe(false);
    expect(isValidDonationAmount('4')).toBe(false);
    expect(isValidDonationAmount('10.5')).toBe(false);
    expect(isValidDonationAmount('')).toBe(false);
    expect(isValidDonationAmount('2000000')).toBe(false);
  });
});

/* ───────────── Contact validation ───────────── */
describe('Egyptian phone validation', () => {
  it('accepts valid 010/011/012/015 numbers', () => {
    for (const p of ['01012345678', '01198765432', '01234567890', '01555555555']) {
      expect(isEgPhone(p)).toBe(true);
    }
  });
  it('rejects wrong prefixes, lengths, and non-digits', () => {
    for (const p of ['01312345678', '0101234567', '010123456789', '11012345678', '0101234567a', '', '+201012345678']) {
      expect(isEgPhone(p)).toBe(false);
    }
  });
});

describe('email validation', () => {
  it('accepts normal emails and rejects malformed ones', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('a@b.co')).toBe(true);
    for (const e of ['user@', '@x.com', 'user example.com', 'user@nodot', '']) {
      expect(isEmail(e)).toBe(false);
    }
  });
});

/* ───────────── Beneficiary privacy (no sensitive data in public case content) ───────────── */
describe('beneficiary privacy', () => {
  const phoneLike = /01[0-9]{9}/;
  const nationalIdLike = /[0-9]{14}/;

  it('no case exposes a phone number or national ID in any public field', () => {
    for (const c of cases) {
      for (const field of [c.code, c.title, c.summary, c.need, c.location, c.lastUpdate ?? '']) {
        expect(field).not.toMatch(phoneLike);
        expect(field).not.toMatch(nationalIdLike);
      }
    }
  });

  it('case locations are governorate-level only (no street-level details)', () => {
    for (const c of cases) {
      expect(c.location).not.toMatch(/شارع|عمارة|منزل رقم|شقة|بجوار/);
      expect(c.location.length).toBeLessThan(30);
    }
  });

  it('cases use anonymised codes, not full family names', () => {
    // At least the family cases must be code-anonymised (أسرة رقم …)
    expect(cases.some((c) => /أسرة رقم [0-9]+/.test(c.code))).toBe(true);
  });
});

/* ───────────── Booking availability rules ───────────── */
describe('booking availability', () => {
  const provider = { ...providers[0], availableDays: [0, 2], unavailableDates: [] as string[] };

  it('only the provider working weekdays are available', () => {
    const base = new Date(2025, 4, 18); // Sunday
    const days = buildAvailableDays(provider, base, 7);
    for (const d of days) {
      const weekday = new Date(d.iso).getDay();
      expect(d.available).toBe(provider.availableDays.includes(weekday));
    }
  });

  it('explicitly-unavailable dates are excluded even on working weekdays', () => {
    const base = new Date(2025, 4, 18); // Sunday (weekday 0 = working)
    const blocked = { ...provider, unavailableDates: ['2025-05-18'] };
    const days = buildAvailableDays(blocked, base, 3);
    expect(days[0].iso).toBe('2025-05-18');
    expect(days[0].available).toBe(false);
  });

  it('booking references follow the AS-###### format', () => {
    expect(makeBookingRef(1736000000)).toMatch(/^AS-[0-9]{6}$/);
    expect(makeBookingRef(1)).toMatch(/^AS-[0-9]{6}$/);
  });
});

/* ───────────── Content invariants used by the UI ───────────── */
describe('content invariants', () => {
  it('raised never exceeds target in seed data (progress bars stay ≤ 100%)', () => {
    for (const x of [...cases, ...projects]) {
      expect(x.raisedAmount).toBeLessThanOrEqual(x.targetAmount);
    }
  });
  it('project updates are dated and newest-first', () => {
    for (const p of projects) {
      const dates = (p.updates ?? []).map((u) => u.date);
      const sorted = [...dates].sort().reverse();
      expect(dates).toEqual(sorted);
    }
  });
});
