import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));
const icon = fs.readFileSync(new URL('assets/favicon.svg', root), 'utf8');
const suppliedIcon = fs.readFileSync('/mnt/data/label-r25-ultralite.svg', 'utf8');

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
assert.equal(icon.trim(), suppliedIcon.trim(), 'favicon should match the supplied icon exactly');
assert.equal((source.match(/__APP_ICON_DATA_URI__/g) || []).length, 2, 'favicon and header icon must share the same embedded source');
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=["']https?:\/\//i);
console.log('v0.2 static tests passed');
