'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const argument = process.argv.indexOf('--html');
const file = argument >= 0 ? process.argv[argument + 1] : path.join(__dirname, '../src/index.template.html');
let html = fs.readFileSync(file, 'utf8');
const payload = html.match(/<script id="self-extract-payload"[^>]*>([A-Za-z0-9+/=\s]+)<\/script>/);
if (payload) html = gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8');
const excluded = [
  "helpModalScroll",
  "回帰確認しています",
  "under full regression",
  "正式版として仕上げています",
  "completes the stable release",
  "元に戻す／やり直す・用紙変更・作業ファイルの読込時は進行中のドラッグを終了します。",
  " Undo/Redo, paper changes, and opening a project retire any active drag.",
  "空欄・無効な位置やサイズは元の値に戻り、"
];
for (const text of excluded) {
  assert.equal(html.includes(text), false, `User-facing help must exclude obsolete audit/implementation copy: ${text}`);
}
assert.ok(html.includes('Alt'), 'Retain the useful snapping shortcut.');
console.log('User-facing help copy regression passed.');
