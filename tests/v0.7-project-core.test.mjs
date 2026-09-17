import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* PROJECT_FILE_CORE:BEGIN \*\/([\s\S]*?)\/\* PROJECT_FILE_CORE:END \*\//);
assert.ok(match, 'Project file core must be embedded between PROJECT_FILE_CORE markers');
const context = vm.createContext({ console, JSON, Date, Number, Object, Array, String, Math, Set });
vm.runInContext(match[1], context);
const core = context.ProjectFileCore;
assert.ok(core, 'ProjectFileCore should be available');

const project = core.createProject({
  appVersion: '0.7.0',
  settings: { paperType: 'a4', paperWidth: 210, paperHeight: 297, labelWidth: 66, labelHeight: 33.9, columns: 3, rows: 8, leftMargin: 6, topMargin: 12, columnGap: 0, rowGap: 0 },
  elements: [{ id: 'image-1', type: 'image', dataUrl: 'data:image/png;base64,AAAA', x: 1, y: 2, width: 10, height: 10 }],
  data: { mode: 'merge', repeatCount: 3, headers: ['name'], rows: [{ name: 'A' }, { name: 'B' }], rowIndex: 1, fileName: 'labels.csv', encoding: 'shift_jis', detectedEncoding: 'shift_jis' },
  sheet: { usedFirstPage: [0, 2, 2, 5] },
  output: { offsetX: 1.2, offsetY: -0.5, filename: 'labels.pdf' }
}, '2026-09-16T12:00:00.000Z');

assert.equal(project.schemaVersion, 1);
assert.equal(project.appVersion, '0.7.0');
assert.equal(project.savedAt, '2026-09-16T12:00:00.000Z');
assert.equal(project.settings.paperType, 'a4');
assert.equal(project.editor.elements[0].dataUrl, 'data:image/png;base64,AAAA');
assert.deepEqual(Array.from(project.sheet.usedFirstPage), [2, 5]);
assert.equal(project.data.rowIndex, 1);

const text = core.serializeProject(project);
assert.ok(text.endsWith('\n'));
const parsed = core.parseProject(text);
assert.equal(parsed.editor.elements[0].type, 'image');
assert.equal(parsed.data.rows[1].name, 'B');
assert.equal(parsed.output.offsetX, 1.2);

assert.equal(core.sanitizeProjectFilename(' 商品/ラベル '), '商品-ラベル.labelsheet.json');
assert.equal(core.sanitizeProjectFilename('work.labelsheet.json'), 'work.labelsheet.json');

assert.throws(() => core.parseProject('{not json'), /PROJECT_INVALID_JSON/);
assert.throws(() => core.parseProject(JSON.stringify({ schemaVersion: 99 })), /PROJECT_UNSUPPORTED_SCHEMA/);
assert.throws(() => core.parseProject(JSON.stringify({ schemaVersion: 1, appVersion: '0.7.0' })), /PROJECT_INVALID_STRUCTURE/);
assert.throws(() => core.parseProject(JSON.stringify({ ...project, editor: { elements: [{ id: 'remote', type: 'image', dataUrl: 'https://example.com/image.png', x: 0, y: 0, width: 10, height: 10 }] } })), /PROJECT_INVALID_STRUCTURE/);
assert.throws(() => core.parseProject(JSON.stringify({ ...project, editor: { elements: [{ id: 'weird', type: 'html', x: 0, y: 0, width: 10, height: 10 }] } })), /PROJECT_INVALID_STRUCTURE/);

const normalized = core.parseProject(JSON.stringify({
  ...project,
  data: { ...project.data, rowIndex: 999, repeatCount: -10 },
  sheet: { usedFirstPage: [-2, 1, 1, 999, '3'] },
  output: { offsetX: 99, offsetY: -99, filename: '' }
}));
assert.equal(normalized.data.rowIndex, 1);
assert.equal(normalized.data.repeatCount, 1);
assert.deepEqual(Array.from(normalized.sheet.usedFirstPage), [1, 3, 999]);
assert.equal(normalized.output.offsetX, 10);
assert.equal(normalized.output.offsetY, -10);
assert.equal(normalized.output.filename, 'label-sheet.pdf');

console.log('v0.7 project file core tests passed');
