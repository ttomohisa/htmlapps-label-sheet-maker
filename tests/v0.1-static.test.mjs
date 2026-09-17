import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const spec = fs.readFileSync(new URL('APP_SPEC.md', root), 'utf8');
const icon = fs.readFileSync(new URL('assets/favicon.svg', root), 'utf8');

for (const id of ['paperPage', 'labelPage', 'sheetPage', 'outputPage', 'appMobileBottomBar', 'paperPreviewSvg']) {
  assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
}
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=[\"']https?:\/\//i, 'runtime source should not load external resources');
assert.doesNotMatch(source, /<link\b[^>]*href=[\"']https?:\/\//i, 'runtime source should not load external styles or fonts');
assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/, 'runtime source should not initiate network APIs');
assert.match(spec, /完全ローカル処理/);
assert.match(spec, /v0\.[12]\.0/);
assert.match(icon.toLowerCase(), /#0e6752/);
assert.equal((source.match(/__APP_ICON_DATA_URI__/g) || []).length, 2);
console.log('v0.1 static tests passed');
