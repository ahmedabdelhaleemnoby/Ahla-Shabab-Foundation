import { useSyncExternalStore } from 'react';
import type { PaymentMethod, ConsultationStatus } from '@ahla/shared';

/**
 * Lightweight in-memory app state (session + donation receipts).
 * TODO(backend): replace with real auth (JWT) + GET /me/donations. Receipt
 * statuses here are ALWAYS pending — 'مكتمل' can only ever arrive from the
 * server (gateway callback) or admin approval, never from the app UI.
 */
export type ReceiptStatus = 'قيد التأكيد' | 'قيد المراجعة' | 'مكتمل' | 'فشل';

export interface Receipt {
  reference: string;
  date: string; // ISO
  amount: string; // display string e.g. "500 ج.م"
  cause: string;
  method: PaymentMethod;
  recurring: boolean;
  status: ReceiptStatus;
}

/** Consultation request (demo — saved locally only, never sent anywhere). */
export interface ConsultationRequest {
  reference: string;
  type: string;
  name: string;
  date: string; // ISO
  status: ConsultationStatus;
}

interface AppState {
  loggedIn: boolean;
  phone: string | null;
  receipts: Receipt[];
  consultations: ConsultationRequest[];
}

let state: AppState = { loggedIn: false, phone: null, receipts: [], consultations: [] };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const appState = {
  get: (): AppState => state,
  login(phone: string) {
    state = { ...state, loggedIn: true, phone };
    emit();
  },
  logout() {
    state = { ...state, loggedIn: false, phone: null };
    emit();
  },
  addReceipt(r: Receipt) {
    state = { ...state, receipts: [r, ...state.receipts] };
    emit();
  },
  addConsultation(c: ConsultationRequest) {
    state = { ...state, consultations: [c, ...state.consultations] };
    emit();
  },
};

// Dev/test hook (stripped from release builds where __DEV__ is false).
declare const __DEV__: boolean;
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  (globalThis as unknown as { __appState?: typeof appState }).__appState = appState;
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state
  );
}
