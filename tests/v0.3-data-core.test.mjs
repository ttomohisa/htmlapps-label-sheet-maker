import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* DATA_MERGE_CORE:BEGIN \*\/([\s\S]*?)\/\* DATA_MERGE_CORE:END \*\//);
assert.ok(match, 'pure data merge core must be embedded between DATA_MERGE_CORE markers');
const context = vm.createContext({ console, TextDecoder, Uint8Array });
vm.runInContext(match[1], context);
const core = context.DataMergeCore;
assert.ok(core, 'DataMergeCore should be available');

const csv = 'name,price,note\r\n"Mug, large",1980,"line1\nline2"\r\nTote,2400,ok';
const parsed = core.parseDelimited(csv, ',');
assert.deepEqual(JSON.parse(JSON.stringify(parsed.headers)), ['name', 'price', 'note']);
assert.equal(parsed.rows.length, 2);
assert.equal(parsed.rows[0].name, 'Mug, large');
assert.equal(parsed.rows[0].note, 'line1\nline2');
assert.equal(parsed.rows[1].price, '2400');

const tsv = core.parseDelimited('name\tprice\nMug\t1980\nTote\t2400', '\t');
assert.deepEqual(JSON.parse(JSON.stringify(tsv.headers)), ['name', 'price']);
assert.equal(tsv.rows[1].name, 'Tote');

const duplicateHeaders = core.parseDelimited('name,name,\nA,B,C', ',');
assert.deepEqual(JSON.parse(JSON.stringify(duplicateHeaders.headers)), ['name', 'name_2', 'column_3']);
assert.equal(duplicateHeaders.rows[0].name_2, 'B');
assert.equal(duplicateHeaders.rows[0].column_3, 'C');

const bom = new Uint8Array([0xef, 0xbb, 0xbf, 0x61]);
assert.equal(core.detectEncoding(bom), 'utf-8');
const shiftJisBytes = new Uint8Array([0x82, 0xa0, 0x2c, 0x31]); // あ,1 in Shift_JIS
assert.equal(core.detectEncoding(shiftJisBytes), 'shift_jis');
assert.equal(core.decodeBytes(shiftJisBytes, 'shift_jis'), 'あ,1');

const field = core.createFieldElement({ id: 'field-1', fieldName: 'price', labelWidth: 66, labelHeight: 33.9 });
assert.equal(field.type, 'text');
assert.equal(field.sourceType, 'field');
assert.equal(field.fieldName, 'price');
assert.equal(core.resolveElementText(field, { price: '1980' }), '1980');
assert.equal(core.resolveElementText(field, {}), '');
assert.equal(core.resolveElementText({ ...field, sourceType: 'fixed', text: 'Fixed' }, { price: '1980' }), 'Fixed');

assert.equal(core.clampRowIndex(-1, 3), 0);
assert.equal(core.clampRowIndex(99, 3), 2);
assert.equal(core.clampRowIndex(1, 0), 0);

console.log('v0.3 data core tests passed');
