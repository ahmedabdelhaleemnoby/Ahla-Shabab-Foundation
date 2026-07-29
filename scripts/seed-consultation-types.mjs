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
 * ─── DECIDED (2026-07-28) ─────────────────────────────────────────────────────
 * Taxonomy: the app's five types win. Keys stay Arabic (نفسية، دينية، طبية،
 * أسرية، أعمال) — they are route params in the app, so latin keys would have
 * meant a navigation change rather than a data migration.
 *
 * Fidelity: this sends the app's FULL definition rather than trimming to the
 * shape the API happens to return today. `disclaimer`, `consent` fields,
 * `validationMessage` and `placeholder` are all included. If the API's DTO
 * whitelists properties it will strip them silently — which is exactly why this
 * script re-reads GET /cms afterwards and reports what actually survived.
 *
 * Where the two sides name the same thing differently, BOTH keys are sent
 * (`name`+`label`, `visible`/`status`+`enabled`) so it works whichever the API
 * reads. Harmless if one is ignored.
 *
 * Not handled: the API's existing `legal` type is left alone — deleting it is a
 * separate call and a separate decision. `psychological` and `family` will
 * collide with the new Arabic-keyed نفسية/أسرية unless removed first; the
 * script warns when it sees them.
 */
import { defaultConsultations } from '../shared/src/cms/cmsDefaults.ts';

const BASE = process.env.API_BASE ?? 'https://portfolio.27lashabab.com/api/v1';
const TOKEN = process.env.API_TOKEN;
const APPLY = process.argv.includes('--apply');

/**
 * Full-fidelity payload. Arabic keys are kept verbatim (decided) — note they are
 * URL-encoded when used in the PATCH/DELETE `/{key}` routes.
 * Dual-named properties are sent under both spellings so either side can read them.
 */
function toApiShape(c) {
  return {
    key: c.key,             // Arabic, matches the app's route param
    name: c.name,           // app spelling
    label: c.name,          // API spelling
    icon: c.icon,
    description: c.description,
    disclaimer: c.disclaimer,
    enabled: c.visible && c.status === 'published', // API spelling
    visible: c.visible,     // app spelling
    status: c.status,
    homeVisible: c.homeVisible,
    availableTimes: c.availableTimes,
    sortOrder: c.sortOrder,
    fields: c.fields
      .filter((f) => !f.hidden)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        key: f.key,
        type: f.type,
        label: f.label,
        required: !!f.required,
        sortOrder: f.sortOrder,
        ...(f.options ? { options: f.options } : {}),
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.validationMessage ? { validationMessage: f.validationMessage } : {}),
        ...(f.help ? { help: f.help } : {}),
        ...(f.showIfKey ? { showIfKey: f.showIfKey, showIfValue: f.showIfValue } : {}),
      })),
  };
}

const payloads = defaultConsultations.map(toApiShape);

/* Only ids are intentionally dropped — the API assigns its own. */
const DROPPED = ['id (type)', 'id (field)', 'imageId'];

console.log(`target: ${BASE}`);
console.log(`mode:   ${APPLY ? 'APPLY (writes to a live service)' : 'dry run'}\n`);

for (const p of payloads) {
  const consent = p.fields.some((f) => f.type === 'consent');
  console.log(`  ${p.key.padEnd(14)} ${String(p.label).padEnd(22)} ${p.fields.length} fields  consent=${consent ? 'yes' : 'NO'}`);
}

console.log(`\nintentionally dropped: ${DROPPED.join(', ')} — the API assigns its own ids.`);
console.log(`everything else is sent as-is, including disclaimer, consent fields,`);
console.log(`validationMessage and placeholder. Whether the API stores them is verified below.`);

/* Warn about the types already on the server that these will sit alongside. */
try {
  const existing = await fetch(`${BASE}/cms`, { signal: AbortSignal.timeout(20000) })
    .then((r) => r.json()).then((j) => (j.data ?? j).consultationTypes ?? []);
  if (existing.length) {
    const keys = existing.map((t) => t.key);
    console.log(`\nalready on the server: ${keys.join(', ')}`);
    const overlap = keys.filter((k) => ['psychological', 'family'].includes(k));
    if (overlap.length) {
      console.log(`  ⚠ ${overlap.join(' and ')} duplicate what نفسية/أسرية will provide.`);
      console.log(`    This script does not delete them — remove via DELETE /admin/cms/consultations/{key}`);
      console.log(`    or the app will show both.`);
    }
    if (keys.includes('legal')) {
      console.log(`  ⚠ 'legal' (قانونية) has no equivalent in the app and is left untouched.`);
      console.log(`    The app cannot render it — it has no form schema on the app side.`);
    }
  }
} catch { /* offline: skip the warning, the payloads are still valid */ }

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

/* Read back and report what the API actually kept — a permissive DTO stores the
   extra properties, a whitelisting one silently drops them. Either way, know. */
console.log(`\n--- verifying what the API stored ---`);
try {
  const after = await fetch(`${BASE}/cms`, { signal: AbortSignal.timeout(20000) })
    .then((r) => r.json()).then((j) => (j.data ?? j).consultationTypes ?? []);
  for (const sent of payloads) {
    const got = after.find((t) => t.key === sent.key);
    if (!got) { console.log(`  ✗ ${sent.key} — not returned by GET /cms`); continue; }
    const lost = [];
    if (!got.disclaimer) lost.push('disclaimer');
    const gotConsent = (got.fields ?? []).some((f) => f.type === 'consent');
    if (!gotConsent) lost.push('consent field');
    const gotVm = (got.fields ?? []).some((f) => f.validationMessage);
    if (!gotVm) lost.push('validationMessage');
    console.log(`  ${lost.length ? '⚠' : '✓'} ${sent.key.padEnd(10)} ${got.fields?.length ?? 0}/${sent.fields.length} fields`
      + (lost.length ? `  — API dropped: ${lost.join(', ')}` : '  — full fidelity'));
  }
  console.log(`\nIf anything was dropped, the API's DTO is whitelisting properties.`);
  console.log(`See BACKEND.md §18.6 — consent and disclaimer are not optional niceties.`);
} catch (e) {
  console.log(`  could not verify: ${e.message}`);
}
process.exit(failed ? 1 : 0);
