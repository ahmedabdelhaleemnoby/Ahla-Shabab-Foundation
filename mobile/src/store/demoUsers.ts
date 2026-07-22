import { appState, type ConsultationRequest } from './appState';

export interface ActivityLogEntry {
  timestamp: string;
  action: string;
  details?: string;
}

export interface DemoUser {
  id: string;
  email: string; // normalized (lowercase, trimmed)
  createdAt: string;
  consultations: ConsultationRequest[];
  activityLogs: ActivityLogEntry[];
}

/** Local in-memory dictionary of demo users indexed by normalized email. */
const demoUsersStore = new Map<string, DemoUser>();

/**
 * Clean helper function to normalize emails consistently across the app.
 * Removes surrounding whitespace and converts to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Find existing demo user or create a new lightweight record.
 * Prevents duplicate user creation for the same normalized email address.
 */
export function findOrCreateDemoUserByEmail(email: string): DemoUser {
  const normalized = normalizeEmail(email);
  let user = demoUsersStore.get(normalized);

  if (!user) {
    user = {
      id: `usr_${Math.random().toString(36).slice(2, 9)}`,
      email: normalized,
      createdAt: new Date().toISOString(),
      consultations: [],
      activityLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'user_created',
          details: 'أنشئ حساب العرض المحلي',
        },
      ],
    };
    demoUsersStore.set(normalized, user);
  }

  return user;
}

/**
 * Attach a consultation request to a demo user record using their normalized email.
 * If the user already existed, records an internal activity log entry for the returning guest.
 */
export function attachConsultationToDemoUser(
  email: string,
  consultation: ConsultationRequest
): void {
  const normalized = normalizeEmail(email);
  const existedBefore = demoUsersStore.has(normalized);
  const user = findOrCreateDemoUserByEmail(email);

  // Avoid duplicate consultation entries by reference
  const exists = user.consultations.some((c) => c.reference === consultation.reference);
  if (!exists) {
    user.consultations.unshift(consultation);
  }

  if (existedBefore) {
    user.activityLogs.unshift({
      timestamp: new Date().toISOString(),
      action: 'returning_guest_submitted_consultation',
      details: `قام الزائر العائد بتسجيل طلب استشارة جديد: ${consultation.reference}`,
    });
  }

  // Also sync to global appState if the currently logged-in user matches this email
  const currentSession = appState.get();
  if (currentSession.email && normalizeEmail(currentSession.email) === normalized) {
    appState.addConsultation(consultation);
  }
}

/**
 * Log in a demo user by email.
 * Links their stored local consultation requests and booking history to the active session.
 */
export function loginDemoUserByEmail(email: string): void {
  const normalized = normalizeEmail(email);
  const user = findOrCreateDemoUserByEmail(normalized);

  // TODO(production): send and verify OTP through backend email service
  appState.login(user.email);

  // Load all user consultations into active appState
  user.consultations.forEach((c) => {
    const activeConsultations = appState.get().consultations;
    if (!activeConsultations.some((ac) => ac.reference === c.reference)) {
      appState.addConsultation(c);
    }
  });

  user.activityLogs.unshift({
    timestamp: new Date().toISOString(),
    action: 'demo_user_logged_in',
    details: 'تم تسجيل الدخول واسترجاع سجل الحجوزات المحلي',
  });
}

/** Retrieve all demo users for internal inspection/debugging. */
export function getDemoUserRecord(email: string): DemoUser | undefined {
  return demoUsersStore.get(normalizeEmail(email));
}
