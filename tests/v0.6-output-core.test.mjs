import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* PDF_OUTPUT_CORE:BEGIN \*\/([\s\S]*?)\/\* PDF_OUTPUT_CORE:END \*\//);
assert.ok(match, 'PDF output core must be embedded between PDF_OUTPUT_CORE markers');
const context = vm.createContext({ console, Math, Number, Object, Array, Uint8Array, TextEncoder });
vm.runInContext(match[1], context);
const core = context.PdfOutputCore;
assert.ok(core, 'PdfOutputCore should be available');

assert.equal(core.mmToPt(25.4), 72);
assert.equal(core.mmToPx(25.4, 300), 300);
assert.equal(core.normalizeOffset(12.35), 10);
assert.equal(core.normalizeOffset(-10.44), -10);
assert.equal(core.normalizeOffset(0.04), 0);
assert.equal(core.normalizeOffset(1.26), 1.3);
assert.equal(core.sanitizePdfFilename(' 商品/ラベル 2026 '), '商品-ラベル 2026.pdf');
assert.equal(core.sanitizePdfFilename('labels.PDF'), 'labels.pdf');

const a4 = core.pageMetrics(210, 297, 300);
assert.deepEqual(JSON.parse(JSON.stringify(a4)), {
  widthMm: 210,
  heightMm: 297,
  widthPt: 595.275591,
  heightPt: 841.889764,
  widthPx: 2480,
  heightPx: 3508,
  dpi: 300
});

// Minimal 1x1 JPEG SOI/EOI bytes are enough for PDF assembly tests; the writer treats image bytes as opaque.
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const pdf = core.buildPdf([{ jpegBytes: jpeg, pixelWidth: 1, pixelHeight: 1 }], 210, 297);
assert.ok(pdf instanceof Uint8Array);
const pdfText = new TextDecoder('latin1').decode(pdf);
assert.ok(pdfText.startsWith('%PDF-1.4'));
assert.match(pdfText, /\/MediaBox \[0 0 595\.275591 841\.889764\]/);
assert.match(pdfText, /\/Subtype \/Image/);
assert.match(pdfText, /\/DCTDecode/);
assert.match(pdfText, /%%EOF\s*$/);

const pdf2 = core.buildPdf([
  { jpegBytes: jpeg, pixelWidth: 100, pixelHeight: 200 },
  { jpegBytes: jpeg, pixelWidth: 100, pixelHeight: 200 }
], 100, 50);
const pdf2Text = new TextDecoder('latin1').decode(pdf2);
assert.equal((pdf2Text.match(/\/Type \/Page\b/g) || []).length, 2);

console.log('v0.6 PDF output core tests passed');
