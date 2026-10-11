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

test('Help describes background locking and internal scrolling in Japanese and English', () => {
  const help = html.match(/<!-- APP:HELP:BEGIN -->([\s\S]*?)<!-- APP:HELP:END -->/)[1];
  assert.ok(help.includes(`<p data-i18n="helpModalScroll">${jaHelp}</p>`));
  assert.ok(html.includes(`helpModalScroll:'${jaHelp}'`));
  assert.ok(html.includes(`helpModalScroll:'${enHelp}'`));
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
  const shells = dialogs.join('\n').replace(/      <p data-i18n="helpModalScroll">[^<]*<\/p>\n/, '');
  assert.equal(hash(shells), 'c74a3f694403a40a1a1cb9d1f51527a3bccb512e1703c3094d1ca550679b0417');
});

test('modal-only patch preserves runtime, editor, data, PDF output and dialog handlers', () => {
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const [name, token] of [['APP_CONFIG', '__APP_CONFIG_JSON__'], ['BUILD_MANIFEST', '__BUILD_MANIFEST_JSON__'], ['assetBundle', '__EMBEDDED_ASSET_BUNDLE_JSON__']]) {
    script = script.replace(new RegExp(`(const ${name} = )[\\s\\S]*?;\\n`), `$1${token};\n`);
  }
  script = script.replace(/helpModalScroll:'[^']*',/g, '');
  assert.equal(hash(script), '1511262da7884490ecc63bb2af47761013353c5bae7922524a7d1ce6e64e9091');
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
