import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* LABEL_EDITOR_CORE:BEGIN \*\/([\s\S]*?)\/\* LABEL_EDITOR_CORE:END \*\//);
assert.ok(match, 'pure label editor core must be embedded between LABEL_EDITOR_CORE markers');
const context = vm.createContext({ console });
vm.runInContext(match[1], context);
const core = context.LabelEditorCore;
assert.ok(core, 'LabelEditorCore should be available from the extracted core');

const text = core.createTextElement({ id: 'text-1', labelWidth: 66, labelHeight: 33.9 });
assert.equal(text.type, 'text');
assert.equal(text.text, 'Text');
assert.ok(text.x >= 0 && text.y >= 0);
assert.ok(text.x + text.width <= 66);
assert.ok(text.y + text.height <= 33.9);
assert.equal(text.fontFamily, 'sans');
assert.equal(text.hAlign, 'left');
assert.equal(text.vAlign, 'top');

const moved = core.moveElement({ ...text, x: 60, y: 30, width: 15, height: 8 }, 20, 20, { width: 66, height: 33.9 });
assert.equal(moved.x, 51);
assert.equal(moved.y, 25.9);

const resized = core.resizeElement({ ...text, x: 10, y: 8, width: 20, height: 10 }, 'nw', 15, 8, { width: 66, height: 33.9 });
assert.ok(resized.width >= 4);
assert.ok(resized.height >= 3);
assert.ok(resized.x >= 0 && resized.y >= 0);
assert.ok(resized.x + resized.width <= 66);
assert.ok(resized.y + resized.height <= 33.9);

const duplicated = core.duplicateElement({ ...text, id: 'old', x: 60, y: 30, width: 6, height: 3.9 }, 'new', { width: 66, height: 33.9 });
assert.equal(duplicated.id, 'new');
assert.ok(duplicated.x + duplicated.width <= 66);
assert.ok(duplicated.y + duplicated.height <= 33.9);

const elements = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
assert.equal(JSON.stringify(core.bringToFront(elements, 'b').map(item => item.id)), JSON.stringify(['a', 'c', 'b']));
assert.equal(JSON.stringify(core.sendToBack(elements, 'b').map(item => item.id)), JSON.stringify(['b', 'a', 'c']));

const tooLarge = core.clampElement({ ...text, x: -10, y: -4, width: 100, height: 100 }, { width: 66, height: 33.9 });
assert.equal(tooLarge.x, 0);
assert.equal(tooLarge.y, 0);
assert.equal(tooLarge.width, 66);
assert.equal(tooLarge.height, 33.9);

console.log('v0.2 editor core tests passed');
