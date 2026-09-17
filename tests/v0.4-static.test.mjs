import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.ok(/^0\.[4-9]\.|^[1-9]\./.test(config.version), 'v0.4 media features must remain in later versions');
for (const id of [
  'addImageButton','imageFileInput','addQrButton','addCode128Button','addCode39Button',
  'textElementSettings','textStyleSection','imageElementSettings','imageFileName','imageFitSelect',
  'codeElementSettings','codeKindBadge','codeValueField','codeValueInput','codeValidation','showHumanTextToggle'
]) assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
assert.match(source, /BARCODE_MEDIA_CORE:BEGIN/);
assert.match(source, /image\/png,image\/jpeg,image\/webp/);
assert.match(source, /QRコードは株式会社デンソーウェーブの登録商標です。/);
assert.match(source, /QR Code is a registered trademark of DENSO WAVE INCORPORATED/);
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=["']https?:\/\//i);
console.log('v0.4 static tests passed');
