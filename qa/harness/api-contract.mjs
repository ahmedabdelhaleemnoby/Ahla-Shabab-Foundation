#!/usr/bin/env node
/**
 * Contract diff: the live API vs what the mobile app's types expect.
 *
 * The app still runs on `@ahla/shared` mock data. Before anyone swaps in the
 * real API, these are the field-level mismatches that would break it. This
 * script is the reproducible version of that comparison — re-run it whenever
 * either side changes, rather than trusting a doc that ages.
 *
 * Read-only, unauthenticated: it touches public GET endpoints only. The admin
 * and /me surfaces need a bearer token and are deliberately not exercised here.
 *
 *   node qa/harness/api-contract.mjs
 *   API_BASE=https://staging.example.com/api/v1 node qa/harness/api-contract.mjs
 */
const BASE = process.env.API_BASE ?? 'https://portfolio.27lashabab.com/api/v1';

/** What the app's TypeScript types require. Keep in step with shared/src. */
const EXPECTED = {
  'cms': {
    source: 'CmsState — shared/src/cms/cmsTypes.ts',
    top: ['version', 'settings', 'paymentMethods', 'menu', 'home', 'pages', 'media', 'consultations', 'activity', 'updatedAt'],
    nested: {
      settings: ['appName', 'heroTitle', 'heroSubtitle', 'splashText', 'primaryColor', 'secondaryColor',
        'hotline', 'email', 'address', 'workingHours', 'website', 'socials', 'zakatNisabEgp',
        'donationReassurance', 'demoLabel', 'stats'],
    },
    arrayItem: { paymentMethods: ['id', 'group', 'description', 'availability', 'manual'] },
  },
  'cases': {
    source: 'HumanitarianCase — shared/src/types.ts',
    listAt: 'data',
    arrayItem: { _self: ['id', 'code', 'title', 'location', 'summary', 'need', 'tag', 'verified',
      'targetAmount', 'raisedAmount', 'supporters'] },
  },
  'consultants': {
    source: 'provider profile — mobile/src/store/providerStore.ts',
    arrayItem: { _self: ['id', 'name'] },
  },
};

const unwrap = (j) => (j && typeof j === 'object' && 'data' in j ? j.data : j);
const keys = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
const bullet = (label, arr) => arr.length ? `      ${label}: ${arr.join(', ')}` : null;

let mismatches = 0;

for (const [ep, spec] of Object.entries(EXPECTED)) {
  let json;
  try {
    const res = await fetch(`${BASE}/${ep}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) { console.log(`\n## /${ep} — HTTP ${res.status}`); mismatches++; continue; }
    json = await res.json();
  } catch (e) {
    console.log(`\n## /${ep} — unreachable: ${e.message}`);
    mismatches++;
    continue;
  }

  let body = unwrap(json);
  if (spec.listAt && body && !Array.isArray(body) && spec.listAt in body) body = body[spec.listAt];

  console.log(`\n## /${ep}   (app side: ${spec.source})`);

  if (spec.top) {
    const got = keys(body);
    const missing = spec.top.filter((k) => !got.includes(k));
    const extra = got.filter((k) => !spec.top.includes(k));
    if (missing.length || extra.length) {
      mismatches++;
      console.log('   top level:');
      [bullet('app expects, API lacks', missing), bullet('API sends, app ignores', extra)]
        .filter(Boolean).forEach((l) => console.log(l));
    } else console.log('   top level: matches');
  }

  for (const [field, want] of Object.entries(spec.nested ?? {})) {
    const got = keys(body?.[field]);
    const missing = want.filter((k) => !got.includes(k));
    const extra = got.filter((k) => !want.includes(k));
    if (missing.length || extra.length) {
      mismatches++;
      console.log(`   ${field}:`);
      [bullet('app expects, API lacks', missing), bullet('API sends, app ignores', extra)]
        .filter(Boolean).forEach((l) => console.log(l));
    } else console.log(`   ${field}: matches`);
  }

  for (const [field, want] of Object.entries(spec.arrayItem ?? {})) {
    const arr = field === '_self' ? body : body?.[field];
    if (!Array.isArray(arr) || !arr.length) {
      console.log(`   ${field === '_self' ? '(list)' : field}: EMPTY — cannot verify item shape`);
      mismatches++;
      continue;
    }
    const got = keys(arr[0]);
    const missing = want.filter((k) => !got.includes(k));
    if (missing.length) {
      mismatches++;
      console.log(`   ${field === '_self' ? '(list item)' : field}:`);
      console.log(`      app expects, API lacks: ${missing.join(', ')}`);
    } else console.log(`   ${field === '_self' ? '(list item)' : field}: matches (${arr.length} rows)`);
  }
}

console.log(`\n${mismatches ? `${mismatches} contract mismatch(es) — see BACKEND.md §18` : 'contract aligned'}`);
