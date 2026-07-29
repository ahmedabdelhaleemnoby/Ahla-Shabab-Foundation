#!/usr/bin/env node
/**
 * Seed the API's consultation types from the app's canonical definitions in
 * shared/src/cms/cmsDefaults.ts.
 *
 * The consultation form is entirely CMS-driven: whatever the API returns for
 * `consultationTypes` is what the app renders. If a type is missing, that form
 * is unreachable; if a field is missing, it simply never appears.
 *
 *   node scripts/seed-consultation-types.mjs            # dry run — prints payloads
 *   API_TOKEN=<bearer> node scripts/seed-consultation-types.mjs --apply
 *
 * Dry run is the default deliberately: this writes to a deployed service.
 * Get a token with POST /api/v1/admin/auth/login; pass the TOKEN, never a password.
 *
 * ─── READ THIS BEFORE APPLYING ────────────────────────────────────────────────
 * The API's existing types and the app's do not agree, and this script cannot
 * decide for you. See BACKEND.md §18.6. In short:
 *   - taxonomy differs — the API has `legal`, the app has دينية/طبية/أعمال
 *   - the API models neither `disclaimer` nor a `consent` field, both of which
 *     the app shows today and both of which matter legally
 * Applying this adds the app's five types in the API's shape. It does NOT delete
 * the API's existing three, so `legal` survives and psychological/family will
 * collide unless you resolve keys first.
 */
import { defaultConsultations } from '../shared/src/cms/cmsDefaults.ts';

const BASE = process.env.API_BASE ?? 'https://portfolio.27lashabab.com/api/v1';
const TOKEN = process.env.API_TOKEN;
const APPLY = process.argv.includes('--apply');

/** app key (Arabic, used as a route param) → API key (latin, as already seeded). */
const KEY_MAP = {
  'نفسية': 'psychological',
  'دينية': 'religious',
  'طبية': 'medical',
  'أسرية': 'family',
  'أعمال': 'business',
};

/** Translate one ConsultationTypeConfig into the shape the API returns today. */
function toApiShape(c) {
  return {
    key: KEY_MAP[c.key] ?? c.key,
    label: c.name,          // API calls it `label`; the app calls it `name`
    icon: c.icon,
    description: c.description,
    enabled: c.visible && c.status === 'published', // API collapses visible+status
    fields: c.fields
      .filter((f) => !f.hidden)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        key: f.key,
        type: f.type,
        label: f.label,
        required: !!f.required,
        ...(f.options ? { options: f.options } : {}),
      })),
  };
}

const payloads = defaultConsultations.map(toApiShape);

/* What the translation cannot carry across. */
const DROPPED_TYPE = ['id', 'disclaimer', 'homeVisible', 'availableTimes', 'sortOrder', 'imageId'];
const DROPPED_FIELD = ['id', 'placeholder', 'validationMessage', 'sortOrder', 'help', 'showIfKey', 'showIfValue'];

console.log(`target: ${BASE}`);
console.log(`mode:   ${APPLY ? 'APPLY (writes to a live service)' : 'dry run'}\n`);

for (const p of payloads) {
  const consent = p.fields.some((f) => f.type === 'consent');
  console.log(`  ${p.key.padEnd(14)} ${String(p.label).padEnd(22)} ${p.fields.length} fields  consent=${consent ? 'yes' : 'NO'}`);
}

console.log(`\ndropped — the API models no equivalent:`);
console.log(`  per type:  ${DROPPED_TYPE.join(', ')}`);
console.log(`  per field: ${DROPPED_FIELD.join(', ')}`);
console.log(`\n  ⚠ \`disclaimer\` is user-visible safety text ("هذه استشارة استرشادية ولا تُغني عن`);
console.log(`    التشخيص أو العلاج المتخصص"). Dropping it on a MEDICAL consultation is not`);
console.log(`    a cosmetic loss. Add a \`disclaimer\` string to the API before applying.`);
console.log(`  ⚠ \`validationMessage\` carries the Arabic error copy the QA pass verified;`);
console.log(`    without it the app falls back to generic messages.`);

if (!APPLY) {
  console.log(`\n--- payloads ---`);
  console.log(JSON.stringify(payloads, null, 2));
  console.log(`\nDry run. Re-run with API_TOKEN=<bearer> ... --apply to write.`);
  process.exit(0);
}

if (!TOKEN) {
  console.error('\nAPI_TOKEN is not set. Obtain one with POST /admin/auth/login and export it.');
  process.exit(1);
}

let ok = 0, failed = 0;
for (const p of payloads) {
  const res = await fetch(`${BASE}/admin/cms/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(p),
  });
  const text = await res.text();
  if (res.ok) { ok++; console.log(`  ✓ ${p.key}`); }
  else { failed++; console.log(`  ✗ ${p.key} — HTTP ${res.status}: ${text.slice(0, 200)}`); }
}
console.log(`\n${ok} created, ${failed} failed.`);
console.log(`Verify: node qa/harness/api-contract.mjs`);
process.exit(failed ? 1 : 0);
