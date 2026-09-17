import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.equal(config.version, '1.0.0', 'stable release must be versioned v1.0.0');
assert.equal(config.build.blockRuntimeNetwork, true);
assert.match(source, /connect-src 'none'/);
assert.match(source, /id="mobileSelectionBar"/);
assert.match(source, /id="snapToggle"/);
assert.match(source, /id="touchContextMenu"/);
assert.match(source, /function createPdfDocument\(/);
assert.match(source, /function saveProjectFile\(/);
assert.doesNotMatch(source, /<script[^>]+src=/i);
assert.doesNotMatch(source, /<link[^>]+href="https?:\/\//i);

console.log('v1.0 stable release static tests passed');
