/**
 * Exercise the shared API layer against the live backend and validate what it
 * produces — the mapped app-shaped objects, not the raw wire payload.
 *
 * This is the counterpart to api-contract.mjs: that one diffs field names, this
 * one proves the mapping actually yields values the app's types accept, and that
 * the fallback path works when the API is unreachable.
 *
 * READ-ONLY by default. It deliberately does not create consultations, bookings
 * or donations, because the target is a live service and those would be real
 * records. The one write it makes is an intentionally INVALID payload, which is
 * rejected with a 400 and stores nothing — that is how the Arabic field-error
 * mapping gets verified without side effects.
 *
 *   npx tsx scripts/verify-api-layer.ts
 *   API_BASE=http://localhost:4010/api/v1 npx tsx scripts/verify-api-layer.ts
 *
 * Lives in scripts/ rather than qa/harness/ on purpose: that directory sets
 * "type": "module", which makes a .ts file there native ESM, and Node then
 * cannot see the names the shared barrel re-exports via `export *` (esbuild adds
 * them at runtime through CJS __exportStar). Metro and Vite both resolve the
 * barrel correctly — it only bites under tsx.
 */
import {
  configureApi,
  fetchArticles,
  fetchCases,
  fetchCmsTagged,
  fetchConsultants,
  fetchProjects,
  fetchServices,
  fetchHomeAggregate,
  statsListToObject,
  submitConsultation,
  ApiError,
  type CmsState,
} from '../shared/src/index';

const BASE = process.env.API_BASE ?? 'https://portfolio.27lashabab.com/api/v1';

const errors: string[] = [];
const known: string[] = [];
const notes: string[] = [];
let checks = 0;
let passed = 0;

function check(label: string, cond: boolean, detail = '') {
  checks++;
  if (cond) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    errors.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

/**
 * A confirmed backend defect, not a mapping bug: reported loudly but it does not
 * fail the run, so this stays usable as a regression check until it is fixed.
 */
function knownIssue(label: string, cond: boolean, detail = '') {
  checks++;
  if (cond) {
    passed++;
    console.log(`  ok   ${label}  (previously a known issue — now fixed)`);
  } else {
    known.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  KNOWN ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

configureApi({
  baseUrl: BASE,
  timeoutMs: 25000,
  onError: (i) =>
    notes.push(`${i.endpoint}: ${i.message}${i.status !== undefined ? ` (HTTP ${i.status})` : ''}${i.fellBack ? ' [fell back]' : ''}`),
});

console.log(`target: ${BASE}\n`);

async function main() {

  /* ------------------------------------------------------------------- CMS */
  console.log('## GET /cms  (mapped onto CmsState)');
  const cms = await fetchCmsTagged();
  const st: CmsState = cms.data;
  check('served from the API (not the bundled fallback)', cms.source === 'api', cms.source);
  check('settings.hotline resolved', !!st.settings.hotline, JSON.stringify(st.settings.hotline));
  check('settings.email resolved', !!st.settings.email);
  check('settings.socials is an object with 4 keys', Object.keys(st.settings.socials).length === 4);
  check('zakatNisabEgp is a number', typeof st.settings.zakatNisabEgp === 'number' && st.settings.zakatNisabEgp > 0);
  check('splashText kept from bundled defaults', !!st.settings.splashText);
  check('donationReassurance kept from bundled defaults', !!st.settings.donationReassurance);
  check('stats.governorates present', !!st.settings.stats.governorates);
  check('version reported as the app schema version', st.version >= 5, String(st.version));

  console.log('\n## payment methods (latin ids -> Arabic union)');
  check('every method has an Arabic id', st.paymentMethods.every((m) => /[؀-ۿ]/.test(m.id)),
    st.paymentMethods.map((m) => m.id).join(', '));
  const GROUPS = ['دفع إلكتروني', 'تحويل بنكي', 'محفظة إلكترونية'];
  check('every group is one of the three display values',
    st.paymentMethods.every((m) => GROUPS.includes(m.group)),
    [...new Set(st.paymentMethods.map((m) => m.group))].join(' | '));
  check('manual flag is boolean everywhere', st.paymentMethods.every((m) => typeof m.manual === 'boolean'));

  console.log('\n## consultation types (the consent/disclaimer guarantee)');
  console.log(`  keys: ${st.consultations.map((c) => c.key).join(', ')}`);
  check('every type has a disclaimer', st.consultations.every((c) => !!c.disclaimer),
    st.consultations.filter((c) => !c.disclaimer).map((c) => c.key).join(', '));
  check('every type ends with a consent field',
    st.consultations.every((c) => c.fields.some((f) => f.type === 'consent')),
    st.consultations.filter((c) => !c.fields.some((f) => f.type === 'consent')).map((c) => c.key).join(', '));
  check('no choice field is missing its options',
    st.consultations.every((c) =>
      c.fields.every((f) => !['radio', 'checkbox', 'multiselect'].includes(f.type) || (f.options?.length ?? 0) > 0)),
  );
  check('the app keys survived (route params intact)',
    ['نفسية', 'دينية', 'طبية', 'أسرية', 'أعمال'].every((k) => st.consultations.some((c) => c.key === k)));

  /* ----------------------------------------------------------------- lists */
  console.log('\n## GET /cases -> HumanitarianCase[]');
  const cs = await fetchCases({ limit: 50 });
  check('returned rows', cs.length > 0, String(cs.length));
  check('tag is a valid CaseTag', cs.every((c) => ['عاجل', 'علاج', 'تعليم', 'سكن'].includes(c.tag)));
  check('gradient synthesised as a 2-tuple', cs.every((c) => Array.isArray(c.gradient) && c.gradient.length === 2));
  check('gradient is stable for the same id',
    JSON.stringify((await fetchCases({ limit: 50 }))[0]?.gradient) === JSON.stringify(cs[0]?.gradient));
  check('amounts are numbers', cs.every((c) => typeof c.targetAmount === 'number' && typeof c.raisedAmount === 'number'));

  console.log('\n## GET /projects -> Project[]');
  const ps = await fetchProjects({ limit: 50 });
  check('returned rows', ps.length > 0, String(ps.length));
  check('status is a valid ProjectStatus', ps.every((p) => ['مستدام', 'جارٍ', 'مكتمل'].includes(p.status)));
  check('stages is always an array', ps.every((p) => Array.isArray(p.stages)));

  console.log('\n## GET /articles -> Article[]');
  const as = await fetchArticles({ limit: 50 });
  check('returned rows', as.length > 0, String(as.length));
  check('category is a valid ArticleCategory', as.every((a) => ['خبر', 'نشاط', 'مقال', 'قافلة'].includes(a.category)));
  check('readMinutes is a number', as.every((a) => typeof a.readMinutes === 'number'));

  console.log('\n## GET /providers -> Consultant[]');
  const cons = await fetchConsultants({ limit: 50 });
  check('returned rows', cons.length > 0, String(cons.length));
  check('type inferred into the ConsultationType union',
    cons.every((c) => ['نفسية', 'دينية', 'أسرية', 'تربوية', 'مهنية', 'قانونية'].includes(c.type)),
    cons.map((c) => `${c.specialty}->${c.type}`).join(', '));
  check('rating is a number', cons.every((c) => typeof c.rating === 'number'));

  console.log('\n## GET /services (paginated envelope)');
  const svc = await fetchServices({ limit: 5 });
  check('items unwrapped from { data: { data, meta } }', Array.isArray(svc.items) && svc.items.length > 0);
  check('meta.total present', typeof svc.meta.total === 'number' && svc.meta.total > 0, JSON.stringify(svc.meta));
  // What matters is not whether the ids look like uuids — they do not, they are
  // `svc-1`..`svc-6` — but whether POST /bookings accepts them. Probed with a
  // deliberately bad timeSlot so nothing is ever created: if serviceId is still
  // rejected it shows up in the field errors alongside timeSlot.
  const probe = await fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId: svc.items[0]?.id,
      applicantName: 'اختبار',
      phone: '01000000000',
      date: '2026-08-05',
      timeSlot: 'DELIBERATELY-INVALID',
    }),
  });
  const probeFields = Object.keys(((await probe.json())?.error?.fields) ?? {});
  check(`POST /bookings accepts the ids GET /services returns (${svc.items[0]?.id})`,
    probe.status === 400 && !probeFields.includes('serviceId'),
    `rejected fields: ${probeFields.join(', ') || '(none)'}`);

  console.log('\n## GET /home (stats list -> object)');
  const home = await fetchHomeAggregate();
  const flat = statsListToObject(home.stats);
  check('stats flattened by key', Object.keys(flat).length >= 3, JSON.stringify(flat));

  /* ------------------------------------------------- raw (unmapped) API state */
  // Everything above validates the MAPPED result, which the fallback protects.
  // These report what the backend itself is actually serving.
  console.log('\n## raw GET /cms — the backend\'s own state, before mapping');
  const rawCms: any = await (await fetch(`${BASE}/cms`)).json().then((j: any) => j.data ?? j);
  const rawTypes: any[] = rawCms.consultations ?? rawCms.consultationTypes ?? [];
  console.log(`  wire version: ${rawCms.version ?? rawCms.schemaVersion}   keys: ${[...rawTypes.map((t) => t.key)].join(', ')}`);
  knownIssue('consultation types are seeded with the app\'s five Arabic keys',
    ['نفسية', 'دينية', 'طبية', 'أسرية', 'أعمال'].every((k) => rawTypes.some((t) => t.key === k)),
    `backend has: ${rawTypes.map((t) => t.key).join(', ')}`);
  knownIssue('every backend consultation type carries a disclaimer',
    rawTypes.length > 0 && rawTypes.every((t) => !!t.disclaimer));
  knownIssue('every backend consultation type carries a consent field',
    rawTypes.length > 0 && rawTypes.every((t) => (t.fields ?? []).some((f: any) => f.type === 'consent')));
  knownIssue('settings.milestones is populated',
    Array.isArray(rawCms.settings?.milestones) && rawCms.settings.milestones.length > 0,
    `value: ${JSON.stringify(rawCms.settings?.milestones)}`);
  knownIssue('paymentMethods use the app\'s Arabic ids',
    (rawCms.paymentMethods ?? []).every((m: any) => /[؀-ۿ]/.test(String(m.id))),
    `backend ids: ${(rawCms.paymentMethods ?? []).map((m: any) => m.id).join(', ')}`);

  /* -------------------------------------------------------- write error path */
  console.log('\n## POST /consultations with a deliberately invalid body (creates nothing)');
  try {
    await submitConsultation({ type: '', name: '', phone: '1', email: 'not-an-email' } as any);
    check('invalid payload rejected', false, 'server accepted it');
  } catch (e) {
    const err = e as ApiError;
    check('rejected with 400', err.status === 400, `status ${err.status}`);
    check('Arabic message surfaced', /[؀-ۿ]/.test(err.message), err.message);
    check('per-field errors mapped', Object.keys(err.fields).length > 0, JSON.stringify(err.fields));
    check('writes do not fall back (the error reached us)', err instanceof ApiError);
  }

  /* ------------------------------------------------------------- fallback */
  console.log('\n## fallback when the API is unreachable');
  configureApi({ baseUrl: 'http://127.0.0.1:9', timeoutMs: 3000 });
  const offlineCases = await fetchCases();
  check('reads serve bundled content instead of throwing', offlineCases.length > 0, String(offlineCases.length));
  const offlineCms = await fetchCmsTagged();
  check('CMS reports source=bundled', offlineCms.source === 'bundled', offlineCms.source);
  check('bundled CMS still has consent fields',
    offlineCms.data.consultations.every((c) => c.fields.some((f) => f.type === 'consent')));
  try {
    await submitConsultation({ type: 'نفسية', name: 'x', phone: '01000000000', email: 'a@b.co' });
    check('writes still refuse to fall back', false, 'unexpectedly resolved');
  } catch (e) {
    check('writes still refuse to fall back', e instanceof ApiError, (e as Error)?.message);
  }

  /* -------------------------------------------------------------- summary */
  console.log(`\n${passed}/${checks} checks passed`);
  if (notes.length) {
    console.log('\nreported through onError (expected during the offline section):');
    for (const n of notes) console.log(`  - ${n}`);
  }
    if (known.length) {
    console.log('\nknown backend defects (do not fail the run):');
    for (const k of known) console.log(`  - ${k}`);
  }
  if (errors.length) {
    console.log('\nfailures:');
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

}

main();
