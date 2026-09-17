import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));
{ const [major,minor]=config.version.split('.').map(Number); assert.ok(major > 0 || minor >= 6, 'current app version must include v0.6 output features'); }
for (const id of ['outputFilename','outputOffsetX','outputOffsetY','outputCalibrationPreset','saveCalibrationButton','deleteCalibrationButton','createCalibrationPdf','createPrintPdf','outputPreviewSvg','outputPagePrev','outputPageNext','outputProgress','outputResult','saveGeneratedPdf']) {
  assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
}
assert.match(source, /function renderOutputPage\(/);
assert.match(source, /function renderOutputResult\(/, 'generated PDF result must rerender for language changes');
assert.match(source, /renderOutputResult\(composition\)/, 'output page must refresh generated result metadata');
assert.match(source, /function createPdfDocument\(/);
assert.match(source, /function rasterizeSvgToJpeg\(/);
assert.match(source, /function renderPrintablePageSvg\(/);
assert.match(source, /labelSheetMaker\.calibrationPresets\.v1/);
assert.doesNotMatch(source, /位置合わせ用PDFと印刷用PDFはv0\.6\.0で追加します/);
console.log('v0.6 static output tests passed');
