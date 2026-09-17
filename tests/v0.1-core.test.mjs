import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.equal(config.name, 'Label Sheet Maker');
assert.equal(config.nameJa, 'ラベルシート作成');
assert.equal(config.slug, 'label-sheet-maker');
assert.match(config.version, /^\d+\.\d+\.\d+$/, 'app version should remain valid semver');
assert.equal(config.build.blockRuntimeNetwork, true);

const match = source.match(/\/\* LABEL_SHEET_CORE:BEGIN \*\/([\s\S]*?)\/\* LABEL_SHEET_CORE:END \*\//);
assert.ok(match, 'pure layout core must be embedded between LABEL_SHEET_CORE markers');
const context = vm.createContext({ console });
vm.runInContext(match[1], context);
const core = context.LabelSheetCore;
assert.ok(core, 'LabelSheetCore should be available from the extracted core');

const a4 = core.paperSizeMm('a4');
assert.deepEqual({ ...a4 }, { width: 210, height: 297 });
const letter = core.paperSizeMm('letter');
assert.deepEqual({ ...letter }, { width: 215.9, height: 279.4 });

const result = core.computeLayout({
  paperWidth: 210,
  paperHeight: 297,
  labelWidth: 66,
  labelHeight: 33.9,
  columns: 3,
  rows: 8,
  leftMargin: 6,
  topMargin: 12.9,
  columnGap: 0,
  rowGap: 0
});
assert.equal(result.valid, true);
assert.ok(Math.abs(result.rightMargin - 6) < 1e-9);
assert.ok(Math.abs(result.bottomMargin - 12.9) < 1e-9);
assert.equal(result.labels.length, 24);
assert.deepEqual({ ...result.labels[0] }, { index: 1, x: 6, y: 12.9, width: 66, height: 33.9 });
assert.deepEqual({ ...result.labels[23] }, { index: 24, x: 138, y: 250.2, width: 66, height: 33.9 });

const overflow = core.computeLayout({
  paperWidth: 100,
  paperHeight: 100,
  labelWidth: 60,
  labelHeight: 60,
  columns: 2,
  rows: 2,
  leftMargin: 0,
  topMargin: 0,
  columnGap: 0,
  rowGap: 0
});
assert.equal(overflow.valid, false);
assert.ok(overflow.errors.includes('horizontal-overflow'));
assert.ok(overflow.errors.includes('vertical-overflow'));

assert.equal(core.toDisplayUnit(25.4, 'in'), 1);
assert.equal(core.fromDisplayUnit(1, 'in'), 25.4);
assert.equal(core.fromDisplayUnit(10, 'mm'), 10);

const presets = core.builtInPresets();
assert.ok(presets.length >= 3);
assert.ok(presets.every(item => !/(A-one|Avery|KOKUYO|コクヨ|エーワン|ラベル屋さん)/i.test(item.nameEn + item.nameJa)));

console.log('v0.1 core tests passed');
