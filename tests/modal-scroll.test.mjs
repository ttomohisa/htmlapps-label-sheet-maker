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

test('shared mobile layout preserves responsive shield visibility and reviewed styles', () => {
  // Baseline: main 53a1e6f87c911fceede460274783abcc7fb3a0a2 (v1.1.3).
  // Strip the modal lock; the reviewed baseline now also includes only the 600px informational-footer hide.
  const existingCss = css.replace(/    html:has\(dialog:modal\),\s*body:has\(dialog:modal\)\s*\{\s*overflow:\s*hidden;?\s*\}\n/, '');
  assert.equal(hash(existingCss), 'f2575f921851af31e1a57ec92bdae18a6bf62e51252f58da684238d60c5f3fab');
});

test('all four dialog shells retain their existing headers, scroll containers and actions', () => {
  const dialogs = [...html.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)].map(match => match[0]);
  assert.deepEqual(dialogs.map(value => value.match(/\bid="([^"]+)"/)[1]), ['appConfirmDialog', 'saveLayoutDialog', 'saveCalibrationDialog', 'helpDialog']);
  // Rebaseline the exact build-details relocation into Help; other dialog shells remain unchanged.
  const shells = dialogs.join('\n').replace(/      <p data-i18n="helpModalScroll">[^<]*<\/p>\n/, '');
  assert.equal(hash(shells), 'a014e744ceab15a06f20b1a317f7e9fb70a6ab540b3af8fbf4d8ccec612f407d');
});

test('shared mobile layout preserves reviewed runtime, editor, data and PDF output', () => {
  // The only runtime addition is the Help descendant-target guard, separately executed by mobile-build-info.test.cjs.
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const [name, token] of [['APP_CONFIG', '__APP_CONFIG_JSON__'], ['BUILD_MANIFEST', '__BUILD_MANIFEST_JSON__'], ['assetBundle', '__EMBEDDED_ASSET_BUNDLE_JSON__']]) {
    script = script.replace(new RegExp(`(const ${name} = )[\\s\\S]*?;\\n`), `$1${token};\n`);
  }
  script = script.replace(/helpModalScroll:'[^']*',/g, '');
  assert.equal(hash(script), '2a542aeb3ce2d4d3c83f14c505f5a6b0693247375bcd5f70849635c9a6b5547a');
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
