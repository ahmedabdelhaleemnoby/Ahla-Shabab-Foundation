/**
 * QA pass 2 — requirements 2, 4, 5, 6, 8 and demo safety at runtime.
 *
 * Every network request the page makes is captured, so "no real API requests"
 * is asserted rather than inferred from grep.
 *
 *   node qa/harness/qa2-flows.mjs
 */
import { launch, boot, nav, shot, sleep, SHOTS } from './lib.mjs';
import { tapExact } from './lib2.mjs';

const results = [];
const rec = (id, desc, status, evidence = '') => {
  results.push({ id, desc, status, evidence });
  console.log(`  ${status.padEnd(7)} ${id} ${desc}${evidence ? ` — ${evidence}` : ''}`);
};

const bodyText = (page) => page.evaluate(() => document.body.innerText);
const has = async (page, s) => (await bodyText(page)).includes(s);

/** Type into the nth visible text input. */
async function typeInto(page, value, nth = 0) {
  const ok = await page.evaluate((n) => {
    const els = [...document.querySelectorAll('input,textarea')].filter((e) => e.getBoundingClientRect().height > 0);
    if (!els[n]) return false;
    els[n].focus();
    return true;
  }, nth);
  if (!ok) throw new Error(`no visible input #${nth}`);
  await page.keyboard.down('Meta'); await page.keyboard.press('a'); await page.keyboard.up('Meta');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(value, { delay: 12 });
  await sleep(350);
  return true;
}

const { browser, page, logs, requests } = await launch(390, 844);
await boot(page);

/* ───────────────────────── 2. EMAIL OTP DEMO ───────────────────────── */
console.log('\n## Requirement 2 — Email OTP demo');
await nav(page, 'EmailAuth');
await shot(page, 'qa2-email-auth');
const authText = await bodyText(page);
rec('OTP-1', 'login screen asks for EMAIL not phone',
  /بريد|إيميل|email/i.test(authText) && !/رقم الجوال|رقم الهاتف/.test(authText) ? 'PASS' : 'FAIL',
  authText.split('\n').filter(Boolean).slice(0, 3).join(' / '));

const inputs = await page.evaluate(() =>
  [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().height > 0)
    .map((e) => ({ type: e.type, inputmode: e.inputMode, placeholder: e.placeholder })));
rec('OTP-2', 'email input present', inputs.length > 0 ? 'PASS' : 'FAIL', JSON.stringify(inputs));

// invalid / empty rejection: the continue button should not navigate
for (const [label, value, shouldPass] of [
  ['empty', '', false],
  ['invalid (no @)', 'notanemail', false],
  ['invalid (trailing dot)', 'a@b.', false],
  ['valid clean', 'guest@ahla.test', true],
  ['valid with spaces + caps', '  Guest@Ahla.TEST  ', true],
]) {
  await nav(page, 'EmailAuth'); await sleep(400);
  if (value) await typeInto(page, value);
  let moved = false;
  try {
    // Match the submit label EXACTLY and take the lowest match. A loose regex
    // matched the screen header "تسجيل الدخول" at y=25 instead of the real
    // button at y=780, so nothing was ever clicked and every case looked like a
    // rejection — the invalid cases passed for the wrong reason.
    const b = await page.evaluate(() => {
      const els = [...document.querySelectorAll('div,span')]
        .filter((e) => (e.innerText || '').trim() === 'إرسال رمز التحقق' && e.getBoundingClientRect().height > 10)
        .sort((a, b2) => b2.getBoundingClientRect().top - a.getBoundingClientRect().top);
      if (!els.length) return null;
      const r = els[0].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (b) { await page.mouse.click(b.x, b.y); await sleep(1100); }
    const route = await page.evaluate(() => {
      const w = (s) => (s.routes[s.index].state ? w(s.routes[s.index].state) : s.routes[s.index].name);
      return w(globalThis.__nav.getRootState());
    });
    moved = route === 'Otp';
  } catch (e) { /* button not found */ }
  rec(`OTP-3-${label}`, `"${label}" ${shouldPass ? 'proceeds to OTP' : 'is rejected'}`,
    moved === shouldPass ? 'PASS' : 'FAIL', `moved=${moved}`);
}

// OTP screen content
await nav(page, 'Otp', { email: 'guest@ahla.test' });
await sleep(600);
await shot(page, 'qa2-otp');
const otpText = await bodyText(page);
rec('OTP-4', 'OTP screen references the EMAIL destination',
  /بريد|إيميل/.test(otpText) ? 'PASS' : 'FAIL', otpText.split('\n').filter(Boolean).slice(0, 3).join(' / '));
rec('OTP-5', 'does NOT claim a real email was sent',
  !/(تم الإرسال|أرسلنا|تم إرسال الرمز إلى بريدك)/.test(otpText) ? 'PASS' : 'FAIL',
  (otpText.match(/تم إرسال[^\n]*/) || ['no such claim'])[0]);
rec('OTP-6', 'demo notice present on the OTP screen',
  /عرض|تجريب|demo/i.test(otpText) ? 'PASS' : 'FAIL',
  (otpText.match(/[^\n]*عرض[^\n]*/) || ['none'])[0].slice(0, 70));
rec('OTP-7', 'resend action exists', /إعادة|إرسال مرة أخرى|لم يصلك/.test(otpText) ? 'PASS' : 'FAIL',
  (otpText.match(/[^\n]*إعادة[^\n]*/) || ['none'])[0].slice(0, 50));
const otpInputs = await page.evaluate(() =>
  [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().height > 0)
    .map((e) => ({ maxLength: e.maxLength, inputMode: e.inputMode })));
rec('OTP-8', 'OTP input accepts six digits', JSON.stringify(otpInputs).includes('6') ? 'PASS' : 'INFO', JSON.stringify(otpInputs));
rec('OTP-9', 'no user-visible TODO/FIXME text',
  !/TODO|FIXME|Mock|Test Data/i.test(otpText + authText) ? 'PASS' : 'FAIL');

/* ───────────────────── 4. GOVERNORATES IN ABOUT US ───────────────────── */
console.log('\n## Requirement 4 — governorates in About');
await nav(page, 'Main', { screen: 'About' });
await sleep(900);
const aboutText = await bodyText(page);
rec('GOV-1', 'About has a governorates section with a clear title',
  aboutText.includes('نطاق عملنا في المحافظات') ? 'PASS' : 'FAIL',
  (aboutText.match(/[^\n]*محافظ[^\n]*/) || ['none'])[0].slice(0, 60));
rec('GOV-2', 'no unverified "22 محافظة" claim',
  !/22\s*محافظة/.test(aboutText) ? 'PASS' : 'FAIL',
  (aboutText.match(/\d+\s*محافظة/) || ['none'])[0]);
await shot(page, 'qa2-about-governorates');

// interaction
let govOk = false, govRoute = 'n/a';
try {
  const first = await page.evaluate(() => {
    const hdr = [...document.querySelectorAll('div,span')].find((e) => (e.innerText || '').trim() === 'نطاق عملنا في المحافظات');
    if (!hdr) return null;
    const after = [...document.querySelectorAll('div,span')]
      .filter((e) => { const r = e.getBoundingClientRect(); const h = hdr.getBoundingClientRect();
        return r.top > h.bottom && r.height > 12 && r.height < 60 && (e.innerText || '').trim().length > 2 && !(e.innerText || '').includes('\n'); })
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const el = after[1] || after[0];
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { text: el.innerText.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (first) {
    await sleep(400);
    const again = await page.evaluate((t) => {
      const el = [...document.querySelectorAll('div,span')].find((e) => (e.innerText || '').trim() === t);
      if (!el) return null; const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, first.text);
    if (again) { await page.mouse.click(again.x, again.y); await sleep(1100); }
    govRoute = await page.evaluate(() => {
      const w = (s) => (s.routes[s.index].state ? w(s.routes[s.index].state) : s.routes[s.index].name);
      return w(globalThis.__nav.getRootState());
    });
    govOk = govRoute === 'GovernorateActivity';
    rec('GOV-3', `tapping a governorate opens its page (tapped "${first.text}")`, govOk ? 'PASS' : 'FAIL', `landed on ${govRoute}`);
  } else {
    rec('GOV-3', 'tapping a governorate opens its page', 'BLOCKED', 'could not locate a chip');
  }
} catch (e) { rec('GOV-3', 'tapping a governorate opens its page', 'BLOCKED', e.message.slice(0, 60)); }

if (govOk) {
  const gText = await bodyText(page);
  await shot(page, 'qa2-governorate-detail');
  rec('GOV-4', 'governorate page shows meaningful content',
    gText.length > 120 ? 'PASS' : 'FAIL', `${gText.length} chars`);
  rec('GOV-5', 'governorate page has a back affordance',
    /رجوع|←|‹|›/.test(gText) || true ? 'INFO' : 'INFO', 'checked visually in screenshot');
} else {
  await nav(page, 'GovernorateActivity', { governorate: 'القاهرة' });
  await sleep(800);
  const gText = await bodyText(page);
  await shot(page, 'qa2-governorate-detail');
  rec('GOV-4', 'governorate page renders when opened directly',
    gText.length > 120 ? 'PASS' : 'FAIL', `${gText.length} chars`);
}

/* ─────────────────── 6. GUEST RESTRICTIONS / LOGIN GATE ─────────────────── */
console.log('\n## Requirement 6 — guest gate on personal screens');
for (const screen of ['DonationHistory', 'Receipts', 'MyBookings', 'AccountSettings', 'Favorites', 'Notifications']) {
  try {
    await nav(page, screen);
    await sleep(700);
    const t = await bodyText(page);
    const gated = /تسجيل الدخول|سجّل الدخول|سجل الدخول/.test(t);
    const friendly = /(لعرض|للوصول|احفظ|تابع|مزايا|سجلك)/.test(t);
    rec(`GATE-${screen}`, `${screen} is gated with an explanation`,
      gated && friendly ? 'PASS' : gated ? 'PARTIAL' : 'FAIL',
      t.split('\n').filter(Boolean).slice(0, 2).join(' / ').slice(0, 80));
  } catch (e) { rec(`GATE-${screen}`, `${screen} gated`, 'BLOCKED', e.message.slice(0, 50)); }
}
await nav(page, 'AccountSettings'); await sleep(500); await shot(page, 'qa2-login-gate');

/* ───────────────── 6b. GUEST PUBLIC BROWSING IS NOT BLOCKED ───────────────── */
console.log('\n## Requirement 13 — guest public browsing');
for (const [screen, params] of [['Main', { screen: 'Cases' }], ['Main', { screen: 'UrgentCases' }], ['Sponsorship', undefined],
  ['Projects', undefined], ['NewsFeed', undefined], ['ServicesBrowse', { parentId: null }], ['Main', { screen: 'Consultations' }]]) {
  try {
    await nav(page, screen, params);
    await sleep(600);
    const t = await bodyText(page);
    const blocked = /تسجيل الدخول للمتابعة|يجب تسجيل الدخول/.test(t);
    rec(`PUB-${params?.screen ?? screen}`, `guest can open ${params?.screen ?? screen}`,
      !blocked && t.length > 80 ? 'PASS' : 'FAIL', `${t.length} chars, gated=${blocked}`);
  } catch (e) { rec(`PUB-${screen}`, `guest can open ${screen}`, 'BLOCKED', e.message.slice(0, 50)); }
}

/* ──────────────────── 5. PROVIDER / CONSULTANT DASHBOARD ──────────────────── */
console.log('\n## Requirement 5 — provider dashboard');
try {
  await nav(page, 'ConsultantDashboard');
  await sleep(1000);
  const d = await bodyText(page);
  await shot(page, 'qa2-provider-dashboard');
  rec('PRV-1', 'dashboard screen renders', d.length > 150 ? 'PASS' : 'FAIL', `${d.length} chars`);
  for (const [k, label] of [['قادمة', 'upcoming'], ['اليوم', 'today'], ['جديد', 'new requests'],
    ['مكتمل', 'completed'], ['ملغاة', 'cancelled']]) {
    rec(`PRV-2-${label}`, `overview shows "${k}"`, d.includes(k) ? 'PASS' : 'FAIL');
  }
  rec('PRV-3', 'working hours / availability section present',
    /مواعيد|ساعات|الدوام|التوفر/.test(d) ? 'PASS' : 'FAIL', (d.match(/[^\n]*(مواعيد|ساعات)[^\n]*/) || ['none'])[0].slice(0, 50));
  rec('PRV-4', 'booking list present', /حجز|طلب/.test(d) ? 'PASS' : 'FAIL');
  rec('PRV-5', 'demo labelling present on dashboard',
    /عرض|تجريب/.test(d) ? 'PASS' : 'PARTIAL', (d.match(/[^\n]*عرض[^\n]*/) || ['none'])[0].slice(0, 60));
} catch (e) { rec('PRV-1', 'dashboard screen renders', 'BLOCKED', e.message.slice(0, 60)); }

/* ─────────────────────── 8. CONSULTATION FORMS ─────────────────────── */
console.log('\n## Requirement 8 — consultation forms');
for (const type of ['نفسية', 'دينية', 'طبية', 'أسرية', 'أعمال']) {
  try {
    await nav(page, 'ConsultationRequest', { type });
    await sleep(900);
    const t = await bodyText(page);
    const common = ['الاسم', 'البريد', 'الهاتف'].filter((f) => t.includes(f));
    rec(`FORM-${type}`, `"${type}" form renders with common fields`,
      t.length > 150 && common.length >= 2 ? 'PASS' : 'FAIL',
      `${t.length} chars, common: ${common.join('/')}`);
    await shot(page, `qa2-form-${type}`);
  } catch (e) { rec(`FORM-${type}`, `"${type}" form renders`, 'BLOCKED', e.message.slice(0, 50)); }
}

/* ───────────────────────── DEMO SAFETY — RUNTIME ───────────────────────── */
console.log('\n## Requirement 21 — demo safety at runtime');
const external = requests.filter((r) => !/localhost|127\.0\.0\.1|data:|blob:/.test(r));
rec('SAFE-1', 'no external network requests during the whole session',
  external.length === 0 ? 'PASS' : 'FAIL', external.slice(0, 4).join(' | ') || 'none');
const errs = logs.filter((l) => l.startsWith('[pageerror]'));
rec('SAFE-2', 'no uncaught page errors', errs.length === 0 ? 'PASS' : 'FAIL', errs.slice(0, 2).join(' | ') || 'none');

await browser.close();
const tally = results.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
console.log(`\n===== ${JSON.stringify(tally)} =====`);
console.log(`screenshots → ${SHOTS}`);
