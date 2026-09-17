import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('src/index.template.html', root), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('app.config.json', root), 'utf8'));

assert.match(config.version, /^(?:0\.(?:8|9)\.|[1-9]\.)/, 'v0.8.2 mobile UX regression must continue to run on later versions');

// Mobile text editing must have a dedicated contextual action.
assert.match(source, /id="editTextButton"/);
assert.match(source, /mobile-edit-button/);
assert.match(source, /selected\.type==='text'&&window\.matchMedia\('\(max-width: 820px\)'\)\.matches/);
assert.match(source, /editTextButton'\)\.addEventListener\('click',focusSelectedTextEditor\)/);

// Delete should expose a reversible action rather than being a dead-end destructive operation.
assert.match(source, /function restoreDeletedElement\(/);
assert.match(source, /deletedSnapshot/);
assert.match(source, /actionLabel:t\('undoDelete'\)/);
assert.match(source, /onAction:restoreDeletedElement/);

// Visible resize knobs stay compact while coarse pointers get a larger invisible hit target.
assert.match(source, /function isCoarsePointer\(/);
assert.match(source, /hitRadius=Math\.max/);
assert.match(source, /fill:'transparent','pointer-events':'all','data-resize-handle'/);
assert.match(source, /pointer-events':'none'/);

// Moving elements should snap to label edges and centers and show transient guides.
assert.match(source, /SNAP_TOLERANCE_MM=1\.2/);
assert.match(source, /function snapMoveElement\(/);
assert.match(source, /bounds\.width\/2/);
assert.match(source, /bounds\.height\/2/);
assert.match(source, /editorState\.snapGuides=snapped\.guides/);
assert.match(source, /for\(const guide of editorState\.snapGuides\)/);

console.log('v0.8.2 mobile UX regression tests passed');
