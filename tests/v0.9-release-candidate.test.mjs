import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.match(config.version, /^(?:0\.9\.0|1\.)/, 'v0.9 release-candidate regression should continue on stable releases');
assert.equal(config.build.blockRuntimeNetwork, true);
assert.match(source, /connect-src 'none'/);
assert.match(source, /id="editTextButton"/);
assert.match(source, /function restoreDeletedElement\(/);
assert.match(source, /function snapMoveElement\(/);
assert.match(source, /function saveProjectFile\(/);
assert.match(source, /function createPdfDocument\(/);
assert.match(source, /id="sheetPreviewSvg"/);
assert.match(source, /id="outputPreviewSvg"/);
assert.doesNotMatch(source, /<script[^>]+src=/i, 'runtime script src should not be present');
assert.doesNotMatch(source, /<link[^>]+href="https?:\/\//i, 'runtime stylesheet/font URL should not be present');

console.log('v0.9 release candidate static tests passed');
