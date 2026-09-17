import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
assert.match(source, /const storedSettings=parseStoredSettings\(\);/);
assert.match(source, /activePresetId:storedSettings\?'custom':'a4-24-66x33\.9'/);
console.log('v0.1 persistence initialization test passed');
