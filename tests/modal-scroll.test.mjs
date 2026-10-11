import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { gunzipSync } from 'node:zlib';

// Structural contracts complement native browser wheel/geometry checks. The
// canonical runner reuses these on source, readable, download and restored HTML.
const root = new URL('../', import.meta.url);
const file = process.env.LABEL_SHEET_TEST_SOURCE || new URL('src/index.template.html', root);
let html = fs.readFileSync(file, 'utf8');
const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
html = html.replace(/\r\n/g, '\n');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const hash = value => createHash('sha256').update(value).digest('hex');
const jaHelp = 'ダイアログを開いている間は背景のスクロールが止まります。内容はダイアログ内でスクロールできます。';
const enHelp = 'Background scrolling is paused while a dialog is open. Scroll inside the dialog to read its contents.';

for (const element of ['html', 'body']) {
  test(`${element} locks only while a native modal is active`, () => {
    const selector = `${element}:has(dialog:modal)`;
    const rule = rules.find(([, selectors]) => selectors.split(',').some(value => value.trim() === selector));
    assert.ok(rule, `${selector} must lock the background scroll container`);
    assert.match(rule[2], /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/);
    for (const [, selectors, declarations] of rules) {
      if (selectors.split(',').some(value => value.trim() === element)) {
        assert.doesNotMatch(declarations, /(?:^|;)\s*overflow(?:-y)?\s*:\s*(?:hidden|clip)\b/, 'Normal page scrolling remains available');
      }
    }
  });
}

test('Help excludes layout audit prose while retaining usage notes', () => {
  const help = html.match(/<!-- APP:HELP:BEGIN -->([\s\S]*?)<!-- APP:HELP:END -->/)[1];
  assert.equal(help.includes('data-i18n="helpModalScroll"'), false);
  assert.equal(html.includes(`helpModalScroll:'${jaHelp}'`), false);
  assert.equal(html.includes(`helpModalScroll:'${enHelp}'`), false);
  assert.match(help, /data-i18n="helpGeometry"/);
  assert.match(help, /data-i18n="helpOffline"/);
});

test('modal-only patch preserves all existing styles including responsive shield visibility', () => {
  // Baseline: main 53a1e6f87c911fceede460274783abcc7fb3a0a2 (v1.1.3).
  // Strip only the approved addition; rebaseline for intentional future redesigns.
  const existingCss = css.replace(/    html:has\(dialog:modal\),\s*body:has\(dialog:modal\)\s*\{\s*overflow:\s*hidden;?\s*\}\n/, '');
  assert.equal(hash(existingCss), '5c3a596692752ae7986ce4f19bdbc722a8f8dab2ee51df2f701945a933b3654f');
});

test('all four dialog shells retain their existing headers, scroll containers and actions', () => {
  const dialogs = [...html.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)].map(match => match[0]);
  assert.deepEqual(dialogs.map(value => value.match(/\bid="([^"]+)"/)[1]), ['appConfirmDialog', 'saveLayoutDialog', 'saveCalibrationDialog', 'helpDialog']);
  // Rebaseline only the intentional JA/EN help-copy removal; shell markup is unchanged.
  const shells = dialogs.join('\n').replace(/      <p data-i18n="helpModalScroll">[^<]*<\/p>\n/, '');
  assert.equal(hash(shells), '36d4188885b4c0818dd5b8ed5a513d8d9b235a407835232b2165e82b18c07a6d');
});

test('modal-only patch preserves runtime, editor, data, PDF output and dialog handlers', () => {
  // The runtime hash includes translation literals; update for the copy-only cleanup.
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const [name, token] of [['APP_CONFIG', '__APP_CONFIG_JSON__'], ['BUILD_MANIFEST', '__BUILD_MANIFEST_JSON__'], ['assetBundle', '__EMBEDDED_ASSET_BUNDLE_JSON__']]) {
    script = script.replace(new RegExp(`(const ${name} = )[\\s\\S]*?;\\n`), `$1${token};\n`);
  }
  script = script.replace(/helpModalScroll:'[^']*',/g, '');
  assert.equal(hash(script), '0105da540da17d33766bf4f3320992e51bfbdef771471f1e32c75ab4e3874aca');
});

test('local-processing badge retains its decorative shield and check', () => {
  const badge = html.match(/<div class="local-badge">([\s\S]*?)<\/div>/)[1];
  assert.match(badge, /<svg[^>]*aria-hidden="true"/);
  assert.match(badge, /<path d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"\/>/);
  assert.match(badge, /<path d="m9 12 2 2 4-5"\/>/);
  assert.match(badge, /data-i18n="localBadge"/);
});

test('canonical repository and distributed-entry-point checks include modal contracts', () => {
  const check = fs.readFileSync(new URL('scripts/check-repository.ps1', root), 'utf8');
  assert.match(check, /node \(Join-Path \$Root "scripts\/run-app-tests\.mjs"\)/);
  const runner = fs.readFileSync(new URL('scripts/run-app-tests.mjs', root), 'utf8');
  assert.match(runner, /name\.endsWith\('\.test\.mjs'\)/);
  assert.match(runner, /name==='modal-scroll\.test\.mjs'/);
  assert.match(runner, /LABEL_SHEET_TEST_SOURCE:source/);
  assert.match(runner, /\['readable','dist\/index\.html'\]/);
  assert.match(runner, /\['root download','label-sheet-maker\.html'\]/);
  assert.match(runner, /\['restored self-extract',restored\]/);
  assert.match(runner, /gunzipSync\(Buffer\.from\(payload\[1\],'base64'\)\)/);
});
