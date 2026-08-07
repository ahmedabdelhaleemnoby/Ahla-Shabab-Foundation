import { paymentMethods } from './data';
import type { PaymentMethod } from './types';

/**
 * Business rules shared by app + dashboard (single source of truth, unit-tested).
 */

/** Egyptian mobile: 11 digits, starts 010/011/012/015. */
export const isEgPhone = (v: string): boolean => /^01[0125][0-9]{8}$/.test(v);

export const isEmail = (v: string): boolean => /^\S+@\S+\.\S+$/.test(v);

/** Statuses a CLIENT is allowed to create a donation with. 'مكتمل' is deliberately impossible. */
export type ClientDonationStatus = 'قيد التأكيد' | 'قيد المراجعة';

/**
 * Initial status for a new donation, derived ONLY from the payment method:
 * - manual methods (bank transfer / InstaPay) → 'قيد المراجعة' (admin approval required)
 * - gateway methods → 'قيد التأكيد' (server payment-callback required)
 * The frontend can never produce 'مكتمل'.
 */
export function initialDonationStatus(method: PaymentMethod): ClientDonationStatus {
  const info = paymentMethods.find((m) => m.id === method);
  return info?.manual ? 'قيد المراجعة' : 'قيد التأكيد';
}

/** A method can be used for a new donation only when it is 'متاحة'. */
export function isMethodUsable(method: PaymentMethod): boolean {
  return paymentMethods.find((m) => m.id === method)?.availability === 'متاحة';
}

/** Positive integer EGP amount within sane bounds. */
export function isValidDonationAmount(v: string | number): boolean {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isInteger(n) && n >= 5 && n <= 1_000_000;
}
