import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* SHEET_COMPOSITION_CORE:BEGIN \*\/([\s\S]*?)\/\* SHEET_COMPOSITION_CORE:END \*\//);
assert.ok(match, 'sheet composition core must be embedded between SHEET_COMPOSITION_CORE markers');
const context = vm.createContext({ console, Math, Number, Object, Array, Set, JSON });
vm.runInContext(match[1], context);
const core = context.SheetCompositionCore;
assert.ok(core, 'SheetCompositionCore should be available');

assert.deepEqual(JSON.parse(JSON.stringify(core.normalizeUsed([1, 1, 3, 0, 7], 6))), [1, 3]);
assert.deepEqual(JSON.parse(JSON.stringify(core.allUsed(4))), [1, 2, 3, 4]);
assert.deepEqual(JSON.parse(JSON.stringify(core.invertUsed([2, 4], 5))), [1, 3, 5]);

const composition = core.compose({ slotCount: 6, itemCount: 8, usedFirstPage: [1, 2, 4] });
assert.equal(composition.pageCount, 2);
assert.equal(composition.itemCount, 8);
assert.equal(composition.usedCount, 3);
assert.equal(composition.firstPageAvailable, 3);
assert.equal(composition.pages[0].slots[0].status, 'used');
assert.equal(composition.pages[0].slots[1].status, 'used');
assert.equal(composition.pages[0].slots[2].itemIndex, 0);
assert.equal(composition.pages[0].slots[3].status, 'used');
assert.equal(composition.pages[0].slots[4].itemIndex, 1);
assert.equal(composition.pages[0].slots[5].itemIndex, 2);
assert.equal(composition.pages[1].slots[0].itemIndex, 3);
assert.equal(composition.pages[1].slots[4].itemIndex, 7);
assert.equal(composition.pages[1].slots[5].status, 'empty');

const empty = core.compose({ slotCount: 6, itemCount: 0, usedFirstPage: [2] });
assert.equal(empty.pageCount, 1);
assert.equal(empty.pages[0].slots[1].status, 'used');
assert.equal(empty.pages[0].slots[0].status, 'empty');

assert.equal(core.itemCountForMode({ mode: 'repeat', repeatCount: 12, rowCount: 3 }), 12);
assert.equal(core.itemCountForMode({ mode: 'merge', repeatCount: 12, rowCount: 3 }), 3);
assert.equal(core.itemCountForMode({ mode: 'merge', repeatCount: 12, rowCount: 0 }), 0);

console.log('v0.5 sheet composition core tests passed');
