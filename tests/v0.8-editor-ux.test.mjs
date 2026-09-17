import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.match(config.version, /^(?:0\.(?:8|9)\.|[1-9]\.)/, 'v0.8 UX regression must continue to run on later versions');

// Canvas selection should own keyboard focus so Delete/Backspace works after clicking an element.
assert.match(source, /id="labelEditorSvg"[^>]*tabindex="0"/);
assert.match(source, /function focusLabelCanvas\(/);
assert.match(source, /focusLabelCanvas\(\)/);
assert.match(source, /function handleEditorKeydown\(/);
assert.match(source, /event\.key==='Delete'\|\|event\.key==='Backspace'/);


// Double-clicking a text element should jump directly to text editing and select the value.
assert.match(source, /function focusSelectedTextEditor\(/);
assert.match(source, /lastTextPointer/);
assert.match(source, /DOUBLE_CLICK_MS=450/);
assert.match(source, /element\.type!=='text'/);
assert.match(source, /textContent\.focus\(\{preventScroll:true\}\)/);
assert.match(source, /textContent\.select\(\)/);
assert.match(source, /now-editorState\.lastTextPointer\.at<=DOUBLE_CLICK_MS/);

// Whole element bounds should advertise and support move interactions; resize handles keep resize cursors.
assert.match(source, /data-element-hitbox/);
assert.match(source, /cursor:'move'|cursor="move"|style\.cursor='move'/);
assert.match(source, /nwse-resize/);
assert.match(source, /nesw-resize/);

// Common element actions should live next to the canvas and use SVG icon buttons.
assert.match(source, /class="editor-toolbar-group selection-actions"/);
for (const id of ['duplicateElementButton','bringFrontButton','sendBackButton','deleteElementButton']) {
  assert.match(source, new RegExp(`<button[^>]+id="${id}"[^>]*>[\\s\\S]*?<svg`, 'm'), `${id} should be an icon action near the canvas`);
}
assert.match(source, /<button[^>]*danger-icon[^>]*id="deleteElementButton"/);

// More practical local/system font choices without external font downloads.
for (const value of ['meiryo','yu-gothic','yu-mincho','hiragino-kaku','hiragino-mincho','maru','mono','system']) {
  assert.match(source, new RegExp(`<option value="${value}"`), `missing font option ${value}`);
}
assert.match(source, /function fontFamilyCss\(key\)[\s\S]*meiryo/);
assert.match(source, /fontMeiryo/);
assert.match(source, /fontYuGothic/);
assert.match(source, /fontYuMincho/);

// Data merge needs a visible entry point from the editor/canvas flow.
assert.match(source, /id="openDataSectionButton"/);
assert.match(source, /id="dataSection"/);
assert.match(source, /data-i18n="dataGuideTitle"/);
assert.match(source, /function focusDataSection\(/);

console.log('v0.8 editor UX tests passed');
