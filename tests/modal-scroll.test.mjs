import assert from 'node:assert/strict';
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

test('mobile hides the introduction outside Paper and the local badge', () => {
  assert.match(css, /@media \(max-width: 600px\)\s*\{[\s\S]*?\.main:not\(:has\(#paperPage\.is-active\)\) \.page-intro\s*\{\s*display:\s*none;/);
  assert.match(css, /@media \(max-width: 820px\)\s*\{\s*\.local-badge\s*\{\s*display:\s*none;/);
  assert.match(html, /<section class="app-page is-active" id="paperPage"/);
  assert.doesNotMatch(html, /id="heroTitle"|data-i18n="introTitle"/);
  assert.match(html, /<p data-i18n="lead">[^<]+<\/p>/);
  assert.match(html, /state\.activePage=pageId;\$\$\('\.app-page'\)\.forEach\(page=>page\.classList\.toggle\('is-active',page\.id===pageId\)\)/);
});

test('all four dialog shells retain their headers, scroll containers and actions', () => {
  const dialogs = [...html.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)].map(match => match[0]);
  assert.deepEqual(dialogs.map(value => value.match(/\bid="([^"]+)"/)[1]), ['appConfirmDialog', 'saveLayoutDialog', 'saveCalibrationDialog', 'helpDialog']);
  for (const [index,header,body,ids] of [
    [0,'app-confirm-header','app-confirm-body',['appConfirmTitle','appConfirmClose','appConfirmMessage','appConfirmCancel','appConfirmOk']],
    [1,'dialog-header','dialog-body',['saveLayoutTitle','closeSaveLayout','saveLayoutForm','layoutName','cancelSaveLayout']],
    [2,'dialog-header','dialog-body',['saveCalibrationTitle','closeSaveCalibration','saveCalibrationForm','calibrationName','cancelSaveCalibration']],
    [3,'dialog-header','dialog-body',['helpTitle','closeHelpButton']]
  ]) {
    assert.ok(dialogs[index].includes('class="'+header+'"'));
    assert.ok(dialogs[index].includes('class="'+body+'"'));
    for(const id of ids)assert.ok(dialogs[index].includes('id="'+id+'"'),id);
    if(index===1||index===2)assert.match(dialogs[index], /type="submit"/);
  }
  assert.match(css,/\.dialog-header\s*\{[^}]*position:sticky/);
  assert.match(dialogs[3], /APP:HELP:BEGIN/);
});

test('project files are a closed native disclosure with existing actions and drop handlers', () => {
  const details=html.match(/<details\b[^>]*id="projectDropZone"[^>]*>[\s\S]*?<\/details>/);
  assert.ok(details);
  assert.doesNotMatch(details[0].split('>')[0], /\bopen\b/);
  assert.match(details[0], /<summary>[\s\S]*?data-i18n="projectTitle"[\s\S]*?<\/summary>/);
  for(const id of ['projectFileName','openProjectButton','saveProjectButton','projectFileInput'])assert.ok(details[0].includes('id="'+id+'"'),id);
  assert.doesNotMatch(details[0], /class="button primary" id="saveProjectButton"/);
  assert.match(html,/projectDropZone\.addEventListener\('drop'/);
  assert.match(html,/\$\('#saveProjectButton'\)\.addEventListener\('click',saveProjectFile\)/);
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
