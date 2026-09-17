import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.ok(/^0\.[5-9]\.|^[1-9]\./.test(config.version), 'v0.5 sheet composition must remain in later versions');
for (const id of [
  'sheetPage','sheetPageTitle','sheetSummaryCount','sheetSummaryPages','sheetSummaryUsed',
  'sheetPreviewSvg','sheetPagePrev','sheetPageNext','sheetPageIndicator',
  'markAllAvailableButton','markAllUsedButton','invertUsedButton','sheetStatusMessage'
]) assert.match(source, new RegExp(`id=["']${id}["']`), `missing ${id}`);
assert.match(source, /SHEET_COMPOSITION_CORE:BEGIN/);
assert.match(source, /すべて使用可能/);
assert.match(source, /すべて使用済み/);
assert.match(source, /選択を反転/);
assert.match(source, /Only the first sheet can mark positions as already used\./);
assert.match(source, /connect-src 'none'/);
assert.doesNotMatch(source, /<(?:script|img|iframe|source)\b[^>]*(?:src|href)=["']https?:\/\//i);
console.log('v0.5 static tests passed');
