import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(process.env.LABEL_SHEET_TEST_SOURCE || new URL('../src/index.template.html', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function functionSource(name) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => new RegExp(`^      (?:async )?function ${name}\\(`).test(line));
  if (start < 0) return '';
  if (!lines[start].trimEnd().endsWith('{')) return lines[start];
  const end = lines.findIndex((line, index) => index > start && /^      }\s*$/.test(line));
  assert.ok(end >= 0, `closing line for ${name}`);
  return lines.slice(start, end + 1).join('\n');
}
class SvgNode {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.childNodes = []; this.style = {}; this.hidden = false; this.disabled = false; this.value = ''; this.textContent = ''; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key]; }
  append(...children) { this.childNodes.push(...children); }
  replaceChildren(...children) { this.childNodes = children; }
  cloneNode() { const node = new SvgNode(this.tagName); node.attrs = {...this.attrs}; node.textContent = this.textContent; node.childNodes = this.childNodes.map(child => child.cloneNode()); return node; }
  remove() {}
  click() {}
}
function createContext() {
  const nodes = new Map(), frames = [], downloads = [], toasts = [], errors = [], rasters = [];
  const c = vm.createContext({console: {error: error => errors.push(error)}, TextEncoder, TextDecoder, Uint8Array, Blob, setTimeout, JSON, Date, Object});
  c.$ = key => { if (!nodes.has(key)) nodes.set(key, new SvgNode(key)); return nodes.get(key); };
  c.t = (key, data = {}) => `${key}:${JSON.stringify(data)}`;
  c.AppToast = {show: toast => toasts.push(toast)};
  c.hasPendingLayoutDrafts = () => false;
  c.language = 'en';
  c.requestAnimationFrame = callback => frames.push(callback);
  c.document = {body:{append(){}},createElementNS: (_, tag) => new SvgNode(tag),createElement: tag => {const node = new SvgNode(tag);node.click = () => downloads.push(node.download);return node;}};
  c.URL = {createObjectURL: () => 'blob:test', revokeObjectURL() {}};
  c.blobUrls = new Set();
  c.textMeasureContext = {font:'', measureText: text => ({width: text.length * 6})};
  c.renderCalibrationPresets = () => {};
  c.paperSummaryName = () => 'paper';
  c.renderLabelEditor = () => {};
  c.dataState = {mode:'repeat',repeatCount:25,headers:[],rows:[],rowIndex:0};
  c.sheetState = {usedFirstPage:[],pageIndex:0};
  c.editorState = {elements:[],selectedId:null};
  c.outputState = {offsetX:0,offsetY:0,pageIndex:0,busy:false,generatedBlob:null,generatedFilename:'labels.pdf',generatedKind:'print',generation:0,sourceFingerprint:null,generatedMetadata:null};
  for (const marker of ['LABEL_SHEET_CORE','LABEL_EDITOR_CORE','DATA_MERGE_CORE','BARCODE_MEDIA_CORE','SHEET_COMPOSITION_CORE','PDF_OUTPUT_CORE']) {
    vm.runInContext(source.split(`/* ${marker}:BEGIN */`)[1].split(`/* ${marker}:END */`)[0], c);
  }
  c.state = {settings:clone(c.LabelSheetCore.builtInPresets()[0].settings)};
  c.editorState.elements = [c.LabelEditorCore.createTextElement({id:'text',labelWidth:66,labelHeight:33.9,text:'OLD'})];
  const names = ['sheetItemCount','sheetComposition','editorBounds','currentDataRow','sheetRowForItem','createSvg','fontFamilyCss','wrapElementText','appendSelectionHandles','renderTextElement','codeValidation','renderCodePlaceholder','renderCodeElement','renderSheetLabelContent','renderPrintablePageSvg','formatBytes','pdfContentFingerprint','capturePdfSnapshot','invalidateGeneratedPdf','refreshPdfValidity','renderOutputResult','renderOutputPage','createPdfDocument','saveGeneratedPdf'];
  for (const name of names) { const body = functionSource(name); if (body) vm.runInContext(body, c); }
  const actualRasterize = functionSource('rasterizeSvgToJpeg');
  c.rasterizeSvgToJpeg = async (svg, settings) => {rasters.push({svg,settings:clone(settings || c.state.settings)});return {jpegBytes:new Uint8Array([0xff,0xd8,0xff,0xd9]),pixelWidth:1,pixelHeight:1};};
  c.$('#outputFilename').value = 'old-proof';
  return {c, frames, downloads, toasts, errors, rasters, actualRasterize};
}
const flush = () => new Promise(resolve => setImmediate(resolve));
async function drain(task, frames) { while (frames.length) {frames.shift()();await flush();} await task; }
async function generate(h, kind='print') { await drain(h.c.createPdfDocument(kind), h.frames); }
function allText(node) { return [node.textContent, ...node.childNodes.map(allText)].join(' '); }

// These tests exercise extracted production functions. Browser-only scheduling, DOM,
// fonts, image loading, and rasterization are replaced with deterministic boundaries.
test('save uses the latest sanitized filename without rerasterizing, including calibration suffix', async () => {
  const h = createContext(); await generate(h); const count = h.rasters.length;
  h.c.$('#outputFilename').value = 'new/name\u0001.PDF'; h.c.saveGeneratedPdf();
  assert.equal(h.downloads.at(-1), h.c.PdfOutputCore.sanitizePdfFilename('new/name\u0001.PDF'));
  assert.equal(h.rasters.length, count);
  await generate(h, 'calibration'); h.c.$('#outputFilename').value = 'latest:calibration'; h.c.saveGeneratedPdf();
  assert.equal(h.downloads.at(-1), 'latest-calibration-calibration.pdf');
});

test('every semantic print input makes old bytes unsaveable and disables Save', async t => {
  const changes = {
    layout: c => c.state.settings.leftMargin += .1,
    element: c => c.editorState.elements[0].text = 'NEW',
    data: c => {c.dataState.headers=['name'];c.dataState.rows=[{name:'NEW'}];},
    mode: c => c.dataState.mode='merge',
    count: c => c.dataState.repeatCount=50,
    used: c => c.sheetState.usedFirstPage=[2],
    offsetX: c => c.outputState.offsetX=4,
    offsetY: c => c.outputState.offsetY=-3,
    pendingLayout: c => c.hasPendingLayoutDrafts=()=>true
  };
  for (const [name, change] of Object.entries(changes)) await t.test(name, async () => {
    const h=createContext(); await generate(h); change(h.c); h.c.renderOutputPage(); h.c.saveGeneratedPdf();
    assert.equal(h.c.outputState.generatedBlob,null);
    assert.equal(h.c.$('#saveGeneratedPdf').disabled,true);
    assert.equal(h.c.$('#outputResult').hidden,true);
    assert.deepEqual(h.downloads,[]);
  });
});

test('direct Save also rejects changed content without depending on a render', async () => {
  const h=createContext();await generate(h);h.c.outputState.offsetX=1;h.c.saveGeneratedPdf();assert.deepEqual(h.downloads,[]);
});

test('result metadata is a frozen record of the bytes, and harmless navigation retains eligibility', async () => {
  const h=createContext();await generate(h);const blob=h.c.outputState.generatedBlob;
  const metadata=h.c.outputState.generatedMetadata;
  assert.ok(Object.isFrozen(metadata));assert.equal(metadata.itemCount,25);assert.equal(metadata.pageCount,2);
  h.c.outputState.pageIndex=1;h.c.sheetState.pageIndex=1;h.c.editorState.selectedId='text';h.c.language='ja';h.c.$('#outputFilename').value='renamed';
  h.c.renderOutputResult({itemCount:999,pageCount:999});
  assert.equal(h.c.outputState.generatedBlob,blob);assert.match(h.c.$('#outputResultMeta').textContent,/"labels":25,"pages":2/);
  h.c.saveGeneratedPdf();assert.deepEqual(h.downloads,['renamed.pdf']);
});

test('merge row preview navigation preserves PDF; repeat current-row changes invalidate field content', async () => {
  const h=createContext();h.c.dataState.mode='merge';h.c.dataState.headers=['name'];h.c.dataState.rows=[{name:'A'},{name:'B'}];
  await generate(h);const blob=h.c.outputState.generatedBlob;h.c.dataState.rowIndex=1;h.c.renderOutputPage();assert.equal(h.c.outputState.generatedBlob,blob);
  h.c.dataState.mode='repeat';h.c.editorState.elements[0].sourceType='field';h.c.editorState.elements[0].fieldName='name';await generate(h);h.c.dataState.rowIndex=0;h.c.renderOutputPage();assert.equal(h.c.outputState.generatedBlob,null);
});

test('render snapshot contains independent layout, label, rows, used slots, and offsets', async () => {
  const h=createContext();h.c.dataState.headers=['name'];h.c.dataState.rows=[{name:'OLD'}];h.c.editorState.elements[0].sourceType='field';h.c.editorState.elements[0].fieldName='name';
  const snapshot=h.c.capturePdfSnapshot ? h.c.capturePdfSnapshot() : null;
  for(const value of [snapshot,snapshot?.settings,snapshot?.elements,snapshot?.data.rows,snapshot?.output])assert.ok(value&&Object.isFrozen(value));
  h.c.editorState.elements[0].text='NEW';h.c.state.settings.paperWidth=220;h.c.state.settings.labelWidth=60;h.c.dataState.rows[0].name='NEW';h.c.sheetState.usedFirstPage=[1];h.c.outputState.offsetX=4;
  const svg=h.c.renderPrintablePageSvg(1,{snapshot});
  assert.equal(svg.getAttribute('viewBox'),'0 0 210 297');assert.match(allText(svg),/OLD/);assert.doesNotMatch(allText(svg),/NEW/);
  assert.equal(svg.childNodes[1].getAttribute('transform'),'translate(0 0)');
  assert.equal(svg.childNodes[1].childNodes[0].getAttribute('viewBox'),'0 0 66 33.9');
});

test('changing work between deferred pages retires the job instead of publishing mixed bytes', async () => {
  const h=createContext();const task=h.c.createPdfDocument('print');h.frames.shift()();await flush();
  assert.equal(h.rasters.length,1);h.c.editorState.elements[0].text='NEW';h.c.state.settings.paperWidth=220;
  await drain(task,h.frames);assert.equal(h.rasters.length,1);assert.equal(h.c.outputState.generatedBlob,null);assert.equal(h.c.outputState.busy,false);
});

test('a stale raster completion cannot overwrite or clear progress for the latest job', async () => {
  const h=createContext();let releaseOld;const raster=h.c.rasterizeSvgToJpeg;let calls=0;
  h.c.rasterizeSvgToJpeg=async (...args)=>{calls++;if(calls===1)await new Promise(resolve=>releaseOld=resolve);return raster(...args);};
  const old=h.c.createPdfDocument();h.frames.shift()();await flush();
  h.c.editorState.elements[0].text='NEW';h.c.renderOutputPage();const latest=h.c.createPdfDocument();
  assert.equal(h.frames.length,1);releaseOld();await old;
  assert.equal(h.c.outputState.busy,true);assert.equal(h.c.$('#outputProgress').hidden,false);
  await drain(latest,h.frames);assert.ok(h.c.outputState.generatedBlob);assert.equal(h.c.outputState.busy,false);assert.deepEqual(h.errors,[]);
});

test('obsolete job errors stay silent and latest failure never resurrects earlier bytes', async () => {
  const h=createContext();let rejectOld;let calls=0;
  h.c.rasterizeSvgToJpeg=async ()=>{if(++calls===1)return new Promise((_,reject)=>rejectOld=reject);throw new Error('LATEST_FAILED');};
  const old=h.c.createPdfDocument();h.frames.shift()();await flush();h.c.editorState.elements[0].text='NEW';h.c.renderOutputPage();
  await generate(h);rejectOld(new Error('OLD_FAILED'));await old;
  assert.equal(h.c.outputState.generatedBlob,null);assert.equal(h.errors.length,1);assert.equal(h.errors[0].message,'LATEST_FAILED');assert.equal(h.toasts.length,1);
});

test('explicit project/source invalidation retires an equal-content in-flight job', async () => {
  const h=createContext();const old=h.c.createPdfDocument();
  if(h.c.invalidateGeneratedPdf)h.c.invalidateGeneratedPdf();
  await drain(old,h.frames);assert.equal(h.c.outputState.generatedBlob,null);assert.equal(h.c.outputState.busy,false);
});

test('rasterization uses supplied snapshot dimensions at 300 dpi and still releases its blob URL', async () => {
  const h=createContext();const c=h.c;vm.runInContext(h.actualRasterize,c);const sizes=[],revoked=[];
  c.XMLSerializer=class{serializeToString(){return '<svg/>';}};c.Image=class{set src(value){this.onload();}};
  c.URL.revokeObjectURL=url=>revoked.push(url);
  c.document.createElement=()=>({width:0,height:0,getContext(){return {fillRect(){},drawImage(){}};},toBlob(callback,type,quality){sizes.push([this.width,this.height,type,quality]);callback(new Blob(['JPEG']));}});
  c.state.settings.paperWidth=100;c.state.settings.paperHeight=50;
  const raster=await c.rasterizeSvgToJpeg(new SvgNode('svg'),{paperWidth:210,paperHeight:297});
  assert.deepEqual(sizes,[[2480,3508,'image/jpeg',.98]]);assert.equal(raster.pixelWidth,2480);assert.equal(raster.pixelHeight,3508);assert.deepEqual(revoked,['blob:test']);assert.equal(c.blobUrls.size,0);
});

test('assembled A4, Letter, and custom PDFs preserve page count and MediaBox geometry', async () => {
  for(const [width,height] of [[210,297],[215.9,279.4],[100,50]]){
    const h=createContext();Object.assign(h.c.state.settings,{paperType:'custom',paperWidth:width,paperHeight:height,labelWidth:20,labelHeight:10,columns:2,rows:2,leftMargin:0,topMargin:0,columnGap:0,rowGap:0});h.c.dataState.repeatCount=5;
    await generate(h);assert.ok(h.c.outputState.generatedBlob);const text=await h.c.outputState.generatedBlob.text(),metrics=h.c.PdfOutputCore.pageMetrics(width,height);
    assert.equal((text.match(/\/Type \/Page\b/g)||[]).length,2);assert.ok(text.includes(`/MediaBox [0 0 ${metrics.widthPt} ${metrics.heightPt}]`));
  }
});

test('a snapshot also freezes localized code-error output while language switches keep valid PDF eligibility', () => {
  const h=createContext();h.c.editorState.elements=[{id:'code',type:'code',kind:'code128',value:'',x:1,y:1,width:20,height:10}];
  const snapshot=h.c.capturePdfSnapshot();h.c.t=key=>`NEW_LANGUAGE:${key}`;
  const svg=h.c.renderPrintablePageSvg(0,{snapshot});
  assert.match(allText(svg),/codeEmpty/);assert.doesNotMatch(allText(svg),/NEW_LANGUAGE/);
});

test('repeat preview navigation of fixed labels does not invalidate unchanged PDF bytes', async () => {
  const h=createContext();h.c.dataState.rows=[{name:'A'},{name:'B'}];await generate(h);
  const blob=h.c.outputState.generatedBlob;h.c.dataState.rowIndex=1;h.c.renderOutputPage();assert.equal(h.c.outputState.generatedBlob,blob);
});
test('pending paper edits explain disabled export and clear the notice after correction',()=>{const {c}=createContext();c.hasPendingLayoutDrafts=()=>true;c.renderOutputPage();assert.equal(c.$('#outputLayoutPending').hidden,false);assert.match(c.$('#outputLayoutPending').textContent,/pdfPendingLayout/);c.hasPendingLayoutDrafts=()=>false;c.renderOutputPage();assert.equal(c.$('#outputLayoutPending').hidden,true);});
