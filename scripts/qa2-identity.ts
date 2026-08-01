/**
 * QA pass 2 — Requirement 7: guest consultation identity (same-email dedup).
 *
 * Exercises mobile/src/store/demoUsers.ts directly. That module imports only
 * React and shared types, so it runs under node without a bundler — which makes
 * this a deterministic check of the exact logic the ConsultationRequest and Otp
 * screens call, rather than an inference from reading it.
 *
 *   npx tsx scripts/qa2-identity.ts
 *
 * Lives in scripts/ rather than qa/harness/: that directory sets
 * "type": "module", which loads appState as a SECOND module instance, so the
 * session assertions fail against a store the helper never wrote to. That is a
 * harness artifact, not an app defect — verified by calling appState.login()
 * directly under both loaders.
 */
import {
  normalizeEmail,
  findOrCreateDemoUserByEmail,
  attachConsultationToDemoUser,
  loginDemoUserByEmail,
  getDemoUserRecord,
} from '../mobile/src/store/demoUsers';
import { appState } from '../mobile/src/store/appState';

let pass = 0, fail = 0;
const check = (id: string, desc: string, ok: boolean, evidence = '') => {
  (ok ? pass++ : fail++);
  console.log(`  ${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id} ${desc}${evidence ? ` — ${evidence}` : ''}`);
};

const consultation = (reference: string, type = 'نفسية') =>
  ({ reference, type, status: 'جديد', date: '2026-08-01', name: 'اختبار' }) as any;

console.log('\n## normalizeEmail');
check('ID-1', 'lowercases', normalizeEmail('Test@Example.COM') === 'test@example.com', normalizeEmail('Test@Example.COM'));
check('ID-2', 'trims surrounding spaces', normalizeEmail('  a@b.co  ') === 'a@b.co', `"${normalizeEmail('  a@b.co  ')}"`);
check('ID-3', 'handles both together', normalizeEmail('  MiXeD@Case.Com ') === 'mixed@case.com');

console.log('\n## find-or-create');
const u1 = findOrCreateDemoUserByEmail('guest@ahla.test');
const u2 = findOrCreateDemoUserByEmail('GUEST@AHLA.TEST');
const u3 = findOrCreateDemoUserByEmail('  guest@ahla.test  ');
check('ID-4', 'same email, different case → same user', u1.id === u2.id, `${u1.id} vs ${u2.id}`);
check('ID-5', 'same email with spaces → same user', u1.id === u3.id, `${u1.id} vs ${u3.id}`);
check('ID-6', 'a different email → a different user',
  findOrCreateDemoUserByEmail('other@ahla.test').id !== u1.id);
check('ID-7', 'creation writes an activity log entry',
  u1.activityLogs.some((l) => l.action === 'user_created'), JSON.stringify(u1.activityLogs[u1.activityLogs.length - 1]?.action));

console.log('\n## two submissions, same identity');
attachConsultationToDemoUser('  Guest@Ahla.TEST ', consultation('AS-1001'));
attachConsultationToDemoUser('guest@ahla.test', consultation('AS-1002', 'أسرية'));
const rec = getDemoUserRecord('GUEST@ahla.test');
check('ID-8', 'both requests attach to ONE identity', rec?.consultations.length === 2, `${rec?.consultations.length} consultations`);
check('ID-9', 'no duplicate user was created', rec?.id === u1.id, `${rec?.id} vs ${u1.id}`);
check('ID-10', 'returning guest is logged internally',
  !!rec?.activityLogs.some((l) => l.action === 'returning_guest_submitted_consultation'),
  rec?.activityLogs.map((l) => l.action).join(', '));
attachConsultationToDemoUser('guest@ahla.test', consultation('AS-1002'));
check('ID-11', 're-submitting the same reference does not duplicate',
  getDemoUserRecord('guest@ahla.test')?.consultations.length === 2,
  `${getDemoUserRecord('guest@ahla.test')?.consultations.length} consultations`);

console.log('\n## login links prior requests');
const before = appState.get().consultations.length;
loginDemoUserByEmail('  GUEST@ahla.test  ');
const after = appState.get();
check('ID-12', 'session email is the normalized form', after.email === 'guest@ahla.test', String(after.email));
check('ID-13', 'prior requests become visible after login', after.consultations.length >= 2,
  `session had ${before}, now ${after.consultations.length}`);
check('ID-14', 'login creates no duplicate user',
  getDemoUserRecord('guest@ahla.test')?.id === u1.id);
loginDemoUserByEmail('guest@ahla.test');
check('ID-15', 'logging in twice does not duplicate history',
  appState.get().consultations.length === after.consultations.length,
  `${appState.get().consultations.length} consultations`);
check('ID-16', 'login is logged internally',
  !!getDemoUserRecord('guest@ahla.test')?.activityLogs.some((l) => l.action === 'demo_user_logged_in'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
