import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../app.config.json', import.meta.url), 'utf8'));
assert.match(config.version, /^\d+\.\d+\.\d+$/, 'later versions must keep valid semver');

const html = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
for (const token of [
  'id="openProjectButton"',
  'id="saveProjectButton"',
  'id="projectFileInput"',
  'id="projectDropZone"',
  'data-i18n="openProject"',
  'data-i18n="saveProject"',
  'ProjectFileCore.createProject',
  'ProjectFileCore.parseProject',
  '.labelsheet.json',
  'PROJECT_INVALID_JSON',
  'PROJECT_UNSUPPORTED_SCHEMA',
  'projectSaved',
  'projectLoaded',
  'projectReplaceTitle',
  'projectReplaceMessage',
  'hasMeaningfulProjectWork',
  "AppConfirm.ask({title:t('projectReplaceTitle')"
]) assert.ok(html.includes(token), `missing v0.7 project token: ${token}`);

assert.match(html, /version-badge" id="versionBadge">v\d+\.\d+\.\d+</);

const loadProjectBlock = html.match(/async function loadProjectFile\(file\)\{([\s\S]*?)\}\n      function setPage/);
assert.ok(loadProjectBlock, 'loadProjectFile implementation must exist');
assert.doesNotMatch(loadProjectBlock[1], /console\.error/, 'invalid user project files should not produce console errors');

console.log('v0.7 static project save/restore tests passed');
