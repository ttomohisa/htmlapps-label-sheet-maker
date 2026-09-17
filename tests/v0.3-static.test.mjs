import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.ok(/^0\.[3-9]\.|^[1-9]\./.test(config.version), 'v0.3 data merge must remain in later versions');
for (const id of [
  'dataModeSelect','repeatCount','dataDropZone','dataFileInput','encodingSelect','pasteDataInput','pasteDataButton',
  'dataStatus','dataPreview','dataPreviewHead','dataPreviewBody','dataRowPrev','dataRowNext','dataRowIndex','dataFieldList',
  'dataFieldSelect','elementSourceType'
]) assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
assert.match(source, /DATA_MERGE_CORE:BEGIN/);
assert.match(source, /Shift_JIS|shift_jis/i);
assert.match(source, /text\/csv|\.csv/i);
assert.match(source, /dragover/);
assert.match(source, /drop/);
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=["']https?:\/\//i);
console.log('v0.3 static tests passed');
