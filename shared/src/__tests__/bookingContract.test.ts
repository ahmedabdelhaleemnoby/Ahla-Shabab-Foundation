import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureApi, fetchAvailability, submitBooking } from '../index';
import { ApiError } from '../api/errors';

/**
 * The booking call nobody was making.
 *
 * `submitBooking` has existed in this package since the API layer was written.
 * `BookAppointmentScreen` never called it: the wizard's last step generated
 * `makeBookingRef(Math.floor(Date.now() / 1000))` on the phone and navigated to
 * a confirmation screen. The applicant got a reference number for a booking
 * that had been recorded nowhere, and was told the team would call them.
 *
 * What these pin is the contract the screen now depends on — the shapes are
 * enforced by `CreateBookingSchema` on the server and fail at runtime on a real
 * phone and nowhere else.
 */

const captured: { url: string; init: RequestInit }[] = [];

const stubJson = (body: unknown, status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      captured.push({ url: String(url), init });
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

beforeEach(() => {
  captured.length = 0;
  configureApi({ baseUrl: 'https://api.test/api/v1', getToken: () => null });
});

afterEach(() => vi.unstubAllGlobals());

describe('fetchAvailability', () => {
  it('asks the service for a date range and returns the days', async () => {
    stubJson({
      data: [
        { date: '2026-08-31', slots: ['09:00', '09:45'] },
        { date: '2026-09-01', slots: ['09:00'] },
      ],
    });

    const days = await fetchAvailability('svc-1', '2026-08-31', '2026-09-06');

    expect(captured[0].url).toContain('/services/svc-1/availability');
    expect(captured[0].url).toContain('from=2026-08-31');
    expect(captured[0].url).toContain('to=2026-09-06');
    expect(days).toEqual([
      { date: '2026-08-31', slots: ['09:00', '09:45'] },
      { date: '2026-09-01', slots: ['09:00'] },
    ]);
  });

  it('returns 24-hour HH:MM — the only form timeSlot accepts', async () => {
    stubJson({ data: [{ date: '2026-08-31', slots: ['09:00', '14:15'] }] });
    const days = await fetchAvailability('svc-1', '2026-08-31', '2026-08-31');
    for (const slot of days[0].slots) expect(slot).toMatch(/^\d{2}:\d{2}$/);
  });

  it('does NOT fall back to invented availability when the API fails', async () => {
    // Every read in this package falls back to bundled data so a screen always
    // renders. Availability must not: offering a slot nobody checked means
    // either a rejected booking or a double-booked appointment.
    stubJson({ error: { code: 'INTERNAL', message: 'boom' } }, 500);
    await expect(fetchAvailability('svc-1', '2026-08-31', '2026-09-06')).rejects.toThrow();
  });
});

describe('submitBooking', () => {
  const input = {
    serviceId: 'svc-1',
    applicantName: 'أحمد محمود',
    phone: '01012345678',
    date: '2026-09-01',
    timeSlot: '09:45',
  };

  it('posts to /bookings and returns the SERVER reference', async () => {
    stubJson({ data: { id: 'b-1', reference: 'AS-7QK2M4' } }, 201);

    const created = await submitBooking(input);

    expect(captured[0].url).toContain('/bookings');
    expect(captured[0].init.method).toBe('POST');
    // The reference must come from the server: it is what the foundation looks
    // the booking up by. A locally generated one matches nothing.
    expect(created.reference).toBe('AS-7QK2M4');
  });

  it('sends the fields CreateBookingSchema requires, in its shapes', async () => {
    stubJson({ data: { id: 'b-1', reference: 'AS-1' } }, 201);
    await submitBooking({ ...input, notes: 'ملاحظة', extraFields: { preferredContact: 'واتساب' } });

    const body = JSON.parse(String(captured[0].init.body));
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.timeSlot).toMatch(/^\d{2}:\d{2}$/);
    expect(body.applicantName.length).toBeGreaterThanOrEqual(2);
    expect(body.phone.length).toBeGreaterThanOrEqual(10);
    // Fields the bookings table has no column for ride along here.
    expect(body.extraFields).toEqual({ preferredContact: 'واتساب' });
  });

  it('surfaces SLOT_TAKEN so the screen can send the user back to the picker', async () => {
    stubJson(
      { error: { code: 'SLOT_TAKEN', message: 'هذا الموعد محجوز بالفعل، يرجى اختيار موعد آخر' } },
      409,
    );

    const err = await submitBooking(input).catch((e) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('SLOT_TAKEN');
    expect((err as ApiError).status).toBe(409);
    // Already Arabic — the screen shows it verbatim.
    expect((err as ApiError).message).toContain('محجوز بالفعل');
  });

  it('surfaces DUPLICATE_BOOKING distinctly from a taken slot', async () => {
    stubJson(
      {
        error: {
          code: 'DUPLICATE_BOOKING',
          message: 'يوجد حجز بالفعل بنفس رقم الهاتف لهذه الخدمة في نفس اليوم',
        },
      },
      409,
    );
    const err = await submitBooking(input).catch((e) => e as ApiError);
    // Same status, different code: only SLOT_TAKEN should reload availability.
    expect((err as ApiError).code).toBe('DUPLICATE_BOOKING');
  });

  it('never reports success when the booking was not created', async () => {
    stubJson({ error: { code: 'NOT_FOUND', message: 'الخدمة غير موجودة' } }, 404);
    await expect(submitBooking(input)).rejects.toThrow();
  });
});
