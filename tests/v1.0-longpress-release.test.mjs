import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');

// A long-press menu must ignore the release that completed the long press itself.
assert.match(source, /\.touch-context-menu\.is-opening\s*\{[^}]*pointer-events\s*:\s*none/);
assert.match(source, /menu\.classList\.add\('is-opening'\)/);
assert.match(source, /function armTouchContextMenu\(/);
assert.match(source, /pointerup[^\n]*armTouchContextMenu|armTouchContextMenu[^\n]*pointerup/);
assert.match(source, /setTimeout\([^,]+,\s*(?:2[5-9]\d|[3-9]\d\d)\s*\)/);
assert.match(source, /clientY-gap-rect\.height/);

console.log('v1.0 long-press release guard test passed');
