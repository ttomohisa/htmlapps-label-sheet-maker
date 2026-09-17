import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const match = source.match(/\/\* BARCODE_MEDIA_CORE:BEGIN \*\/([\s\S]*?)\/\* BARCODE_MEDIA_CORE:END \*\//);
assert.ok(match, 'barcode/media core must be embedded between BARCODE_MEDIA_CORE markers');
const context = vm.createContext({ console, TextEncoder, Uint8Array, Array, Math, Number, String, Object, RegExp, JSON });
vm.runInContext(match[1], context);
const core = context.BarcodeMediaCore;
assert.ok(core, 'BarcodeMediaCore should be available');

assert.equal(core.isSupportedImageMime('image/png'), true);
assert.equal(core.isSupportedImageMime('image/jpeg'), true);
assert.equal(core.isSupportedImageMime('image/webp'), true);
assert.equal(core.isSupportedImageMime('image/svg+xml'), false);

const image = core.createImageElement({
  id: 'img-1', dataUrl: 'data:image/png;base64,AAAA', mime: 'image/png', fileName: 'logo.png',
  naturalWidth: 640, naturalHeight: 320, labelWidth: 66, labelHeight: 33.9,
});
assert.equal(image.type, 'image');
assert.equal(image.fit, 'contain');
assert.equal(image.mime, 'image/png');
assert.ok(image.width > image.height, 'landscape image should stay landscape');

assert.equal(core.validateCode39('ABC-123'), true);
assert.equal(core.validateCode39('abc'), false);
const code39 = core.encodeCode39('A1');
assert.equal(code39.text, 'A1');
assert.equal(code39.sequence[0], '*');
assert.equal(code39.sequence.at(-1), '*');
assert.equal(code39.patterns[0], '010010100');
assert.equal(code39.patterns[1], '100001001');
assert.equal(code39.patterns[2], '100100001');

assert.equal(core.validateCode128B('Hello!'), true);
assert.equal(core.validateCode128B('こんにちは'), false);
const code128 = core.encodeCode128B('A');
assert.deepEqual(JSON.parse(JSON.stringify(code128.codes)), [104, 33, 34, 106]);
assert.deepEqual(JSON.parse(JSON.stringify(code128.patterns)), ['211214', '111323', '131123', '2331112']);

const qr = core.encodeQrMatrix('こんにちは');
assert.equal(qr.version, 2);
assert.equal(qr.size, 25);
const qrRows = qr.matrix.map(row => row.map(Boolean).map(v => v ? '1' : '0').join(''));
assert.equal(qrRows.join('\n'), `1111111001101001101111111
1000001011001110101000001
1011101010010101001011101
1011101011001000101011101
1011101000110001101011101
1000001000100001001000001
1111111010101010101111111
0000000011111011100000000
1000001011010000011001110
0001100011101100100100111
0011001101001111101110100
1111100110010101110011111
0111111101111100110101011
1110100000100001001010001
1010101001111000101100100
1011100110010000111010010
1010001010110001111111001
0000000011001110100010000
1111111000110001101011000
1000001001101100100010110
1011101001001010111110010
1011101000100011000010101
1011101000011001000010101
1000001000010010101111101
1111111010000110001111001`);

const qrElement = core.createCodeElement({ id:'qr-1', kind:'qr', sourceType:'field', fieldName:'url', labelWidth:66, labelHeight:33.9 });
assert.equal(qrElement.type, 'code');
assert.equal(qrElement.kind, 'qr');
assert.equal(core.resolveCodeValue(qrElement, { url:'https://example.com' }), 'https://example.com');

console.log('v0.4 media core tests passed');
