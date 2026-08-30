import { describe, it, expect } from 'vitest';
import { mapCatalogService, mapProvider, mapServiceCategory } from '../api/mappers';

/*
 * The booking catalog used to exist only as mock data in `services.ts`, with
 * ids (`sv-psych`, `pr-tarek`, `counseling`) the server has never issued. The
 * booking screen built its payload from those, which is one of the reasons it
 * could never have posted successfully: `POST /bookings` answers an unknown
 * serviceId with «الخدمة غير موجودة».
 *
 * These mappers put the server's real catalog behind the same shapes. The rows
 * below are copied from live `GET /categories`, `/providers` and `/services`.
 */

describe('mapServiceCategory', () => {
  const row = {
    id: 'cat-1-0',
    name: 'أحوال شخصية',
    icon: 'file-text',
    description: null,
    parentId: 'cat-1',
    active: true,
  };

  it('maps a nested category', () => {
    expect(mapServiceCategory(row)).toMatchObject({
      id: 'cat-1-0',
      name: 'أحوال شخصية',
      icon: 'file-text',
      parentId: 'cat-1',
      active: true,
    });
  });

  it('keeps a top-level parentId as null, not undefined', () => {
    // `childCategories(null)` compares with ===, so undefined would hide every
    // root category and the browse screen would open empty.
    const root = mapServiceCategory({ ...row, parentId: null });
    expect(root.parentId).toBeNull();
    const missing = mapServiceCategory({ id: 'x', name: 'y' });
    expect(missing.parentId).toBeNull();
  });

  it('turns a null description into undefined rather than the string "null"', () => {
    expect(mapServiceCategory(row).description).toBeUndefined();
  });

  it('rewrites an icon Feather does not define', () => {
    // Live data has `people`; Feather calls it `users` and renders nothing for
    // an unknown name.
    expect(mapServiceCategory({ ...row, icon: 'people' }).icon).toBe('users');
    expect(mapServiceCategory({ ...row, icon: 'sparkle-unicorn' }).icon).toBe('grid');
    expect(mapServiceCategory({ ...row, icon: null }).icon).toBe('grid');
  });
});

describe('mapProvider', () => {
  const row = {
    id: 'provider-2',
    name: 'أ. فاطمة حسن',
    specialization: 'أخصائية اجتماعية',
    bio: 'أخصائية اجتماعية متخصصة في شؤون الأسرة والطفل',
    yearsExperience: 10,
    rating: 4.9,
    reviews: 89,
    schedules: [
      { weekday: 0, startTime: '10:00', endTime: '12:00', slotMinutes: 30 },
      { weekday: 2, startTime: '10:00', endTime: '11:00', slotMinutes: 30 },
    ],
  };

  it('derives the working weekdays from the schedule', () => {
    expect(mapProvider(row).availableDays).toEqual([0, 2]);
  });

  it('expands each schedule into slots and de-duplicates the overlap', () => {
    // Sunday gives 10:00/10:30/11:00/11:30, Tuesday repeats 10:00/10:30.
    expect(mapProvider(row).slots).toEqual(['10:00', '10:30', '11:00', '11:30']);
  });

  it('lists a weekday once when the provider works it in two blocks', () => {
    // A morning and an afternoon schedule on the same day is ordinary. Without
    // de-duplication the day renders twice in the picker.
    const split = mapProvider({
      ...row,
      schedules: [
        { weekday: 1, startTime: '09:00', endTime: '11:00', slotMinutes: 60 },
        { weekday: 1, startTime: '15:00', endTime: '17:00', slotMinutes: 60 },
      ],
    });
    expect(split.availableDays).toEqual([1]);
    expect(split.slots).toEqual(['09:00', '10:00', '15:00', '16:00']);
  });

  it('produces the same gradient for the same provider every render', () => {
    expect(mapProvider(row).gradient).toEqual(mapProvider(row).gradient);
    expect(mapProvider(row).gradient).toHaveLength(2);
  });

  it('survives a provider with no schedule at all', () => {
    const bare = mapProvider({ id: 'p', name: 'n' });
    expect(bare.availableDays).toEqual([]);
    expect(bare.slots).toEqual([]);
    expect(bare.unavailableDates).toEqual([]);
  });

  it('does not loop forever on a schedule that never ends', () => {
    const runaway = mapProvider({
      ...row,
      schedules: [{ weekday: 1, startTime: '00:00', endTime: '23:59', slotMinutes: 1 }],
    });
    expect(runaway.slots.length).toBeLessThanOrEqual(49);
  });
});

describe('mapCatalogService', () => {
  const row = {
    id: 'svc-6',
    name: 'جلسة دعم جماعي',
    description: 'جلسة دعم نفسي جماعية',
    categoryId: 'cat-0-2',
    providerId: 'provider-1',
    free: true,
    requireNationalId: false,
    active: true,
  };

  it('carries the ids the booking payload depends on', () => {
    const s = mapCatalogService(row);
    // These two are what reach POST /bookings and the provider lookup.
    expect(s.id).toBe('svc-6');
    expect(s.providerId).toBe('provider-1');
    expect(s.categoryId).toBe('cat-0-2');
  });

  it('defaults free and requireNationalId when the payload omits them', () => {
    const s = mapCatalogService({ id: 'a', name: 'b', description: '', categoryId: 'c', providerId: 'd' });
    expect(s.free).toBe(true);
    expect(s.requireNationalId).toBe(false);
  });
});
