import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(process.env.LABEL_SHEET_TEST_SOURCE || new URL('../src/index.template.html', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function functionSource(name) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => new RegExp(`^      (?:async )?function ${name}\\(`).test(line));
  if (start < 0) return '';
  if (!lines[start].trimEnd().endsWith('{')) return lines[start];
  const end = lines.findIndex((line, index) => index > start && /^      }\s*$/.test(line));
  assert.ok(end >= 0, `closing brace for ${name}`);
  return lines.slice(start, end + 1).join('\n');
}
function runtime() {
  const nodes = new Map(), messages = [], reads = [], images = [], confirmations = [];
  const context = vm.createContext({ console: { warn() {}, error() {} }, TextEncoder, TextDecoder, Uint8Array, Blob, JSON, Date, setTimeout });
  Object.assign(context, {
    $: key => { if (!nodes.has(key)) nodes.set(key, { value: '', textContent: '' }); return nodes.get(key); },
    t: key => key,
    AppToast: { show: value => messages.push(value.message) },
    AppConfirm: { ask: () => { const value = deferred(); confirmations.push(value); return value.promise; } },
    FileReader: class { readAsDataURL(file) { this.file = file; reads.push(this); } },
    Image: class { set src(value) { this.dataUrl = value; images.push(this); } },
    closeTouchContextMenu() {}, renderLabelEditor() {}, renderPresetOptions() {}, render() {}, setPage() {}, pushEditorHistory() {},
    dataState: { mode: 'repeat', repeatCount: 1, headers: [], rows: [], rowIndex: 0, fileBytes: null, fileName: '', encoding: 'auto', detectedEncoding: 'utf-8' },
    sheetState: { usedFirstPage: [], pageIndex: 0 },
    editorState: { elements: [], selectedId: null, history: [[]], historyIndex: 0 },
    outputState: { offsetX: 0, offsetY: 0, generatedBlob: null, generation: 0 }, layoutDrafts: {},
    projectFileName: 'labels.labelsheet.json', editorIdCounter: 1
  });
  for (const marker of ['LABEL_SHEET_CORE', 'LABEL_EDITOR_CORE', 'DATA_MERGE_CORE', 'BARCODE_MEDIA_CORE', 'PROJECT_FILE_CORE', 'SHEET_COMPOSITION_CORE', 'PDF_OUTPUT_CORE']) {
    const match = source.match(new RegExp(`/\\* ${marker}:BEGIN \\*/([\\s\\S]*?)/\\* ${marker}:END \\*/`));
    assert.ok(match, marker);
    vm.runInContext(match[1], context);
  }
  context.defaultSettings = clone(context.LabelSheetCore.builtInPresets()[0].settings);
  context.state = { settings: clone(context.defaultSettings) };
  const importState = source.match(/^      const importState=.*;$/m);
  if (importState) vm.runInContext(importState[0], context);
  for (const name of ['cancelLongPress', 'cancelEditorInteraction', 'resetLayoutDrafts', 'invalidateGeneratedPdf', 'invalidatePendingImports', 'editorBounds', 'applyParsedData', 'parseTextData', 'loadDataFile', 'reparseDataFile', 'applyProject', 'hasMeaningfulProjectWork', 'loadProjectFile', 'inferImageMime', 'newEditorId', 'loadImageElement']) {
    vm.runInContext(functionSource(name), context);
  }
  // Exercise the actual file-picker and paste handlers, including same-file reselection.
  const listeners = new Map();
  context.$('#dataFileInput').addEventListener = (type, listener) => listeners.set('dataFileInput', listener);
  context.$('#pasteDataButton').addEventListener = (type, listener) => listeners.set('pasteDataButton', listener);
  for (const id of ['dataFileInput', 'pasteDataButton']) {
    const line = source.split('\n').find(value => value.startsWith(`      $('#${id}').addEventListener`));
    vm.runInContext(line, context);
  }
  return { context, messages, reads, images, confirmations, listeners };
}
function csvFile(name, value) {
  const read = deferred();
  return { read, file: { name, arrayBuffer: () => read.promise }, resolve: () => read.resolve(new TextEncoder().encode(`name\n${value}`).buffer) };
}
function project(context, label) {
  return context.ProjectFileCore.createProject({ appVersion: '1.0.0', settings: context.defaultSettings, elements: [], data: { headers: ['name'], rows: [{ name: label }], fileName: `${label}.csv` }, sheet: {}, output: { filename: `${label}.pdf` } });
}
async function microtasks() { await Promise.resolve(); await Promise.resolve(); }
function finishRead(read, dataUrl = 'data:image/png;base64,AAAA') { read.result = dataUrl; read.onload(); }
function finishImage(image) { image.naturalWidth = 100; image.naturalHeight = 50; image.onload(); }

for (const [input, headers] of [
  ['name,name,name_2', ['name', 'name_3', 'name_2']],
  ['name_2,name,name', ['name_2', 'name', 'name_3']],
  [',column_1,column_1', ['column_1', 'column_1_2', 'column_1_3']],
  ['column_3,column_3,', ['column_3', 'column_3_2', 'column_3_3']],
  ['__proto__,__proto__,constructor', ['__proto__', '__proto___2', 'constructor']]
]) test(`headers preserve every source column: ${input}`, () => {
  const { context: c } = runtime();
  const parsed = c.DataMergeCore.parseDelimited(`${input}\nA,B,C`);
  assert.deepEqual(clone(parsed.headers), headers);
  assert.deepEqual(headers.map(header => parsed.rows[0][header]), ['A', 'B', 'C']);
  for (const header of headers) assert.ok(Object.hasOwn(parsed.rows[0], header));
});
for (const order of ['old-first', 'new-first']) test(`latest CSV owns data (${order})`, async () => {
  const { context: c } = runtime();
  const a = csvFile('a.csv', 'OLD'), b = csvFile('b.csv', 'NEW');
  const first = c.loadDataFile(a.file), second = c.loadDataFile(b.file);
  if (order === 'old-first') { a.resolve(); await first; assert.equal(c.dataState.rows.length, 0); b.resolve(); await second; }
  else { b.resolve(); await second; a.resolve(); await first; }
  assert.equal(c.dataState.fileName, 'b.csv'); assert.equal(c.dataState.rows[0].name, 'NEW');
  assert.equal(c.DataMergeCore.decodeBytes(c.dataState.fileBytes), 'name\nNEW');
});
test('new pasted data owns pending CSV and resets file-only encoding state', async () => {
  const { context: c, listeners } = runtime();
  const a = csvFile('a.csv', 'OLD'), loading = c.loadDataFile(a.file);
  c.$('#pasteDataInput').value = 'name\nPASTED';
  c.dataState.encoding = 'shift_jis'; listeners.get('pasteDataButton')();
  a.resolve(); await loading;
  assert.equal(c.dataState.rows[0].name, 'PASTED'); assert.equal(c.dataState.fileName, 'pastedData');
  assert.equal(c.dataState.fileBytes, null); assert.equal(c.dataState.encoding, 'auto');
});
test('latest CSV failure does not allow older success or stale error notifications', async () => {
  const { context: c, messages } = runtime();
  c.parseTextData('name\nCURRENT', { name: 'current' }); messages.length = 0;
  const a = csvFile('a.csv', 'OLD'), b = csvFile('b.csv', 'NEW');
  const first = c.loadDataFile(a.file), second = c.loadDataFile(b.file);
  b.read.reject(new Error('new read failed')); await second;
  a.resolve(); await first;
  assert.equal(c.dataState.fileName, 'current'); assert.deepEqual(messages, ['dataReadFailed']);
  const stale = csvFile('stale.csv', 'STALE'), pending = c.loadDataFile(stale.file);
  c.parseTextData('name\nPASTED', { name: 'pasted' }); messages.length = 0;
  stale.read.reject(new Error('stale read failed')); await pending;
  assert.deepEqual(messages, []); assert.equal(c.dataState.fileName, 'pasted');
});
test('CSV file picker clears selection so the same file can be selected again', async () => {
  const { context: c, listeners } = runtime(); const file = csvFile('same.csv', 'NEW');
  const target = { files: [file.file], value: 'same.csv' };
  listeners.get('dataFileInput')({ target }); assert.equal(target.value, '');
  file.resolve(); await microtasks(); assert.equal(c.dataState.rows[0].name, 'NEW');
});
for (const order of ['old-first', 'new-first']) test(`latest project owns replacement (${order})`, async () => {
  const { context: c, confirmations } = runtime(); const a = deferred(), b = deferred();
  const first = c.loadProjectFile({ name: 'a.labelsheet.json', text: () => a.promise });
  const second = c.loadProjectFile({ name: 'b.labelsheet.json', text: () => b.promise });
  if (order === 'old-first') { a.resolve(JSON.stringify(project(c, 'OLD'))); await first; assert.equal(c.dataState.rows.length, 0); b.resolve(JSON.stringify(project(c, 'NEW'))); await second; }
  else { b.resolve(JSON.stringify(project(c, 'NEW'))); await second; a.resolve(JSON.stringify(project(c, 'OLD'))); await microtasks(); for (const prompt of confirmations) prompt.resolve(true); await first; }
  assert.equal(c.dataState.rows[0].name, 'NEW'); assert.equal(confirmations.length, 0);
});
test('project confirmation cannot commit after a newer request starts', async () => {
  const { context: c, confirmations } = runtime(); c.parseTextData('name\nCURRENT');
  const first = c.loadProjectFile({ name: 'a.labelsheet.json', text: async () => JSON.stringify(project(c, 'OLD')) });
  await microtasks(); assert.equal(confirmations.length, 1);
  const b = deferred(); const second = c.loadProjectFile({ name: 'b.labelsheet.json', text: () => b.promise });
  confirmations[0].resolve(true); await first; assert.equal(c.dataState.rows[0].name, 'CURRENT');
  b.resolve(JSON.stringify(project(c, 'NEW'))); await microtasks(); confirmations[1].resolve(true); await second;
  assert.equal(c.dataState.rows[0].name, 'NEW');
});
test('cancelled or invalid project preserves current work and pending CSV', async () => {
  const { context: c, confirmations } = runtime(); c.parseTextData('name\nCURRENT');
  const csv = csvFile('next.csv', 'NEXT'), dataLoading = c.loadDataFile(csv.file);
  const opening = c.loadProjectFile({ name: 'project.json', text: async () => JSON.stringify(project(c, 'REPLACEMENT')) });
  await microtasks(); confirmations[0].resolve(false); await opening;
  assert.equal(c.dataState.rows[0].name, 'CURRENT');
  await c.loadProjectFile({ name: 'bad.json', text: async () => '{invalid' });
  assert.equal(c.dataState.rows[0].name, 'CURRENT');
  csv.resolve(); await dataLoading; assert.equal(c.dataState.rows[0].name, 'NEXT');
});
test('project commit retires pending CSV and project completions', async () => {
  const { context: c, messages } = runtime();
  const csv = csvFile('old.csv', 'OLD'), pendingData = c.loadDataFile(csv.file), oldProject = deferred();
  const pendingProject = c.loadProjectFile({ name: 'old.json', text: () => oldProject.promise });
  c.applyProject(project(c, 'RESTORED')); messages.length = 0;
  csv.resolve(); oldProject.reject(new Error('obsolete read')); await Promise.all([pendingData, pendingProject]);
  assert.equal(c.dataState.rows[0].name, 'RESTORED'); assert.equal(c.dataState.fileBytes, null); assert.deepEqual(messages, []);
});
for (const phase of ['reading', 'decoding']) test(`project commit retires image ${phase}`, async () => {
  const { context: c, reads, images, messages } = runtime();
  const pending = c.loadImageElement({ name: 'old.png', type: 'image/png' });
  if (phase === 'decoding') { finishRead(reads[0]); await microtasks(); }
  c.applyProject(project(c, 'RESTORED')); messages.length = 0;
  if (phase === 'reading') { finishRead(reads[0]); await microtasks(); }
  if (images[0]) finishImage(images[0]); await pending;
  assert.equal(c.editorState.elements.length, 0); assert.deepEqual(messages, []);
});
test('latest image selection owns both file-read and image-decode results', async () => {
  const { context: c, reads, images } = runtime();
  const first = c.loadImageElement({ name: 'old.png', type: 'image/png' });
  finishRead(reads[0]); await microtasks();
  const second = c.loadImageElement({ name: 'new.png', type: 'image/png' });
  finishRead(reads[1]); await microtasks(); finishImage(images[1]); await second;
  finishImage(images[0]); await first;
  assert.deepEqual(clone(c.editorState.elements.map(value => value.fileName)), ['new.png']);
});
test('unsupported newest image selection suppresses older success and stale image errors', async () => {
  const { context: c, reads, images, messages } = runtime();
  const first = c.loadImageElement({ name: 'old.png', type: 'image/png' });
  await c.loadImageElement({ name: 'bad.svg', type: 'image/svg+xml' });
  finishRead(reads[0]); await microtasks(); if (images[0]) finishImage(images[0]); await first;
  assert.equal(c.editorState.elements.length, 0); assert.deepEqual(messages, ['unsupportedImage']);
  messages.length = 0;
  const stale = c.loadImageElement({ name: 'stale.png', type: 'image/png' });
  c.applyProject(project(c, 'RESTORED')); reads[1].error = new Error('stale'); reads[1].onerror(); await stale;
  assert.deepEqual(messages, []);
});

test('empty newest pasted-table attempt still retires an earlier pending file', async () => {
  const { context: c, listeners, messages } = runtime(); c.parseTextData('name\nCURRENT', { name: 'current' }); messages.length = 0;
  const old = csvFile('old.csv', 'OLD'), pending = c.loadDataFile(old.file);
  c.$('#pasteDataInput').value = '   '; listeners.get('pasteDataButton')(); old.resolve(); await pending;
  assert.equal(c.dataState.fileName, 'current'); assert.deepEqual(messages, ['pasteDataEmpty']);
});
test('newest failed project prevents older successful project completion', async () => {
  const { context: c, messages } = runtime(); const old = deferred();
  const first = c.loadProjectFile({ name: 'old.json', text: () => old.promise });
  await c.loadProjectFile({ name: 'invalid.json', text: async () => '{invalid' });
  old.resolve(JSON.stringify(project(c, 'OLD'))); await first;
  assert.equal(c.dataState.rows.length, 0); assert.deepEqual(messages, ['projectInvalidJson']);
});
test('newest failed image decode prevents older image from being added', async () => {
  const { context: c, reads, images, messages } = runtime();
  const old = c.loadImageElement({ name: 'old.png', type: 'image/png' }); finishRead(reads[0]); await microtasks();
  const newest = c.loadImageElement({ name: 'broken.png', type: 'image/png' }); finishRead(reads[1]); await microtasks();
  images[1].onerror(); await newest; finishImage(images[0]); await old;
  assert.equal(c.editorState.elements.length, 0); assert.deepEqual(messages, ['imageReadFailed']);
});
test('CSV encoding override and reparse retain current file bytes and source name', async () => {
  const { context: c } = runtime(); const bytes = new Uint8Array([0x6e,0x61,0x6d,0x65,0x0a,0x82,0xa0]);
  await c.loadDataFile({ name: 'sjis.csv', arrayBuffer: async () => bytes.buffer });
  assert.equal(c.dataState.rows[0].name, 'あ'); assert.equal(c.dataState.detectedEncoding, 'shift_jis');
  c.dataState.encoding = 'utf-8'; c.reparseDataFile(); assert.notEqual(c.dataState.rows[0].name, 'あ');
  c.dataState.encoding = 'shift_jis'; c.reparseDataFile();
  assert.equal(c.dataState.rows[0].name, 'あ'); assert.equal(c.dataState.fileName, 'sjis.csv');
  assert.deepEqual([...c.dataState.fileBytes], [...bytes]);
});
test('project restore retires PDF generation, pending paper drafts, and delete Undo together',()=>{const {context:c}=runtime();c.layoutDrafts.labelWidth='';c.editorState.deletedSnapshot={element:{id:'obsolete'}};c.outputState.generatedBlob={size:10};c.outputState.generation=4;c.outputState.busy=true;c.applyProject(project(c,'replacement'));assert.equal(c.outputState.generation,5);assert.equal(c.outputState.busy,false);assert.equal(c.outputState.generatedBlob,null);assert.deepEqual(clone(c.layoutDrafts),{});assert.equal(c.editorState.deletedSnapshot,null);assert.equal(c.dataState.rows[0].name,'replacement');});
test('valid project restore normalizes element bounds and used slots before seeding history',()=>{const {context:c}=runtime(),value=project(c,'bounds');value.editor.elements=[{...c.LabelEditorCore.createTextElement({id:'outside',labelWidth:66,labelHeight:33.9,text:'Keep me'}),x:100,y:100}];value.sheet.usedFirstPage=[2,999];c.applyProject(value);const element=c.editorState.elements[0];assert.ok(element.x+element.width<=66);assert.ok(element.y+element.height<=33.9);assert.deepEqual(clone(c.editorState.history[0]),clone(c.editorState.elements));assert.deepEqual(clone(c.sheetState.usedFirstPage),[2]);});
test('invalid project layout remains recoverable without destroying imported geometry or used positions',()=>{const {context:c}=runtime(),value=project(c,'invalid');value.settings.paperWidth=10;value.editor.elements=[{...c.LabelEditorCore.createTextElement({id:'keep',labelWidth:66,labelHeight:33.9,text:'Keep me'}),x:50,y:20}];value.sheet.usedFirstPage=[2,999];c.applyProject(value);assert.equal(c.editorState.elements[0].x,50);assert.deepEqual(clone(c.sheetState.usedFirstPage),[2,999]);});

test('completed image read retires partial drag before selecting the new image',async()=>{
  const h=runtime(),c=h.context,original=c.LabelEditorCore.createTextElement({id:'original',labelWidth:66,labelHeight:33.9});
  c.editorState.elements=[{...original,x:original.x+5}];c.editorState.selectedId=original.id;c.editorState.interaction={pointerId:7,id:original.id,original:clone(original)};
  const work=c.loadImageElement({name:'synthetic.png',type:'image/png'});finishRead(h.reads[0]);await microtasks();finishImage(h.images[0]);await work;
  assert.equal(c.editorState.interaction,null);assert.equal(c.editorState.elements[0].x,original.x);assert.equal(c.editorState.elements.length,2);assert.equal(c.editorState.elements[1].type,'image');
});
