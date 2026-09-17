import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');

// 1. Selected elements should expose a dedicated mobile fixed action bar above the workflow tabs.
assert.match(source, /id="mobileSelectionBar"/);
assert.match(source, /mobile-selection-bar/);
assert.match(source, /id="mobileSelectionDuplicate"/);
assert.match(source, /id="mobileSelectionBringFront"/);
assert.match(source, /id="mobileSelectionSendBack"/);
assert.match(source, /id="mobileSelectionDelete"/);

// 2. Snap guides must be user-toggleable and default to enabled.
assert.match(source, /id="snapToggle"/);
assert.match(source, /snapEnabled:true/);
assert.match(source, /editorState\.snapEnabled/);

// 3. Keyboard/mouse modifiers: Shift = larger nudge, Alt during drag = temporary snap bypass.
assert.match(source, /event\.shiftKey\?1:\.2/);
assert.match(source, /event\.altKey/);
assert.match(source, /!editorState\.snapEnabled\|\|event\.altKey/);

// 4. Touch long press should open a contextual menu and cancel when the pointer moves.
assert.match(source, /id="touchContextMenu"/);
assert.match(source, /LONG_PRESS_MS/);
assert.match(source, /function scheduleLongPress\(/);
assert.match(source, /function cancelLongPress\(/);
assert.match(source, /function openTouchContextMenu\(/);
assert.match(source, /longPress\.moved/);

console.log('v1.0 mobile UX tests passed');
