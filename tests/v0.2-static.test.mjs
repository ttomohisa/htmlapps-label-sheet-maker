import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));
const icon = fs.readFileSync(new URL('assets/favicon.svg', root), 'utf8');
const suppliedIconSha256 = 'a8c47eb4bc7d3a30bfdc6a237a800cf331fa31bf8c32865d36541de8c5ee197e'; // Normalized canonical icon; supplied foreground geometry preserved.

assert.match(config.version, /^\d+\.\d+\.\d+$/, 'app version should remain valid semver');
for (const id of [
  'labelEditorSvg', 'addTextButton', 'labelInspector', 'textContent', 'fontFamily', 'fontSize',
  'boldToggle', 'hAlign', 'vAlign', 'wrapToggle', 'duplicateElementButton', 'deleteElementButton',
  'bringFrontButton', 'sendBackButton', 'undoButton', 'redoButton', 'zoomRange', 'panModeButton', 'safeAreaToggle'
]) assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
assert.match(source, /LABEL_EDITOR_CORE:BEGIN/);
assert.match(source, /resizeHandles=.*'nw'.*'se'/s);
assert.match(source, /'data-resize-handle':name/);
assert.match(source, /keydown/);
assert.match(source, /Ctrl\/Cmd \+ Z|Ctrl\/Cmd \+ Z|Ctrl\+Z/i);
assert.equal(createHash('sha256').update(icon).digest('hex'), suppliedIconSha256, 'favicon should match the normalized canonical icon exactly');
assert.equal((source.match(/__APP_ICON_DATA_URI__/g) || []).length, 2, 'favicon and header icon must share the same embedded source');
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=["']https?:\/\//i);
console.log('v0.2 static tests passed');
