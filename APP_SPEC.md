# Label Sheet Maker / ラベルシート作成 — Product Specification

## 1. Product

Label Sheet Maker is a Browser Kitty app for defining physical label-sheet geometry, designing one label, merging local tabular data, marking already-used label positions, calibrating printer offset, and producing print-ready PDF files.

Japanese name: **ラベルシート作成**

Repository: `ttomohisa/htmlapps-label-sheet-maker`

Current development milestone: **v1.0.0 — Stable Release**

## 2. Product principles

- Browser-only operation.
- No account and no installation.
- **完全ローカル処理**: user-entered values and selected files remain in the browser unless the user explicitly exports a file.
- No runtime CDN, analytics, telemetry, remote fonts, or API calls.
- `connect-src 'none'` remains enabled.
- Release both `dist/index.html` and `dist/index.self-extract.html` as self-contained files.
- Japanese and English live in the same HTML.
- Desktop and smartphone are first-class layouts.
- Use `assets/favicon.svg` as the single icon source for the favicon and upper-left app icon.
- Brand accent: `#16624F`.

## 3. User goal

The complete v1.0 workflow is:

1. Define the sheet and label dimensions.
2. Design one label.
3. Optionally merge CSV or pasted table data.
4. Select used positions on a partially consumed sheet.
5. Calibrate printer X/Y offset.
6. Generate a print-ready PDF.

The product is not a Canva-style general design tool or a replacement for desktop DTP software.

## 4. Navigation

The app has four persistent workflow destinations:

1. Paper / 用紙
2. Label / ラベル
3. Sheet / シート
4. Output / 出力

Desktop uses a visible step navigation. Smartphone uses the template mobile bottom page-tab pattern with safe-area padding. Do not stack all four full workflows into one long smartphone page.

## 5. v0.1.0 — Paper Layout / App Foundation

### 5.1 Required paper sizes

- A4: 210 × 297 mm
- Letter: 215.9 × 279.4 mm
- Custom paper width and height

Internal geometry uses millimetres. The UI can display/edit dimensions in mm or inches. Switching display units must not alter the underlying physical dimensions.

### 5.2 Geometry inputs

- Paper width
- Paper height
- Label width
- Label height
- Columns
- Rows
- Left margin
- Top margin
- Horizontal gap
- Vertical gap

Right and bottom margins are calculated results.

Reject or visibly flag:

- non-positive dimensions,
- rows/columns below 1,
- layouts that extend beyond the right paper edge,
- layouts that extend beyond the bottom paper edge.

### 5.3 Built-in presets

Built-in presets are generic dimension-based presets. They must not use manufacturer trademarks, manufacturer logos, claims of official compatibility, or copied manufacturer artwork.

Preset labels describe dimensions and grid only, such as:

`A4 / 24 labels / 66 × 33.9 mm / 3 × 8`

### 5.4 Custom preset persistence

Users can save the current geometry with a user-provided name in browser storage. Saved presets can be loaded and deleted.

Deletion is irreversible from browser storage and uses the reusable `AppConfirm` pattern.

Storage failure must not break the editor; show a useful status message instead.

### 5.5 Preview

Show a live sheet preview with:

- paper outline,
- all label rectangles,
- label numbering,
- paper size,
- label size,
- label count,
- calculated right/bottom margins.

The preview keeps physical aspect ratio and must remain usable on smartphones without horizontal page overflow.

### 5.6 v0.1 inactive pages

Label, Sheet, and Output destinations exist in the navigation and explain the next development stages, but they do not pretend to implement those features yet.


## 6. v0.2.0 — Label Editor

### 6.1 Canvas and coordinates

The Label destination edits one label using SVG and physical millimetre coordinates. Screen zoom and pan must not change stored geometry. The label canvas follows the current Paper step label width/height.

### 6.2 Text elements

Users can add multiple text elements. Each element stores:

- id and type,
- x / y / width / height in millimetres,
- text content,
- font family category,
- font size in points,
- bold state,
- horizontal and vertical alignment,
- wrap state.

Supported font categories are generic system-safe groups: Sans serif, Serif, Monospace, and System. No remote font is loaded.

### 6.3 Element manipulation

- Select by click/tap.
- Drag to move.
- Resize from all four corners.
- Duplicate.
- Delete.
- Bring to front / Send to back.
- Direct X/Y/width/height numeric editing using the current mm/in display unit.
- Elements are clamped to the label bounds.
- Safe-area guide is visible by default and can be toggled.

### 6.4 View controls

- 50–300% zoom.
- Explicit pan mode for moving around a zoomed canvas.
- Canvas size preserves label aspect ratio.

### 6.5 Undo / Redo and keyboard

Editor history keeps up to 50 previous element snapshots. Required keyboard behavior:

- Ctrl/Cmd + Z: Undo
- Ctrl/Cmd + Shift + Z: Redo
- Delete / Backspace: delete selected element
- Arrow keys: nudge 0.2 mm
- Shift + Arrow keys: nudge 1 mm
- Escape: clear selection

### 6.6 v0.2 exclusions

Images, QR codes, barcodes, sheet composition, and PDF output remain inactive until later milestones. v0.2 does not persist label content to browser storage; project save/restore is introduced in v0.7.0.

### 6.7 v0.2 acceptance criteria

- A text element can be added and edited.
- Multiple text elements can coexist.
- Move and four-corner resize stay inside label bounds.
- Duplicate / delete / front / back actions work.
- Font family, size, bold, alignment, and wrapping update the SVG preview.
- Undo / Redo restore editor element snapshots.
- Keyboard nudging uses physical coordinates.
- Zoom does not alter stored geometry.
- Pan mode can move around a zoomed canvas.
- The Label screen remains usable on smartphone widths without document-level horizontal overflow.
- The supplied application icon is the canonical `assets/favicon.svg` and is reused by favicon and header icon placeholders.
- v0.1 paper-layout tests continue to pass.

## 7. v0.3.0 — Data Merge

### 7.1 Print-content modes

The Label step supports two modes:

- Repeat the same label for a user-entered count.
- Merge tabular data so one source row represents one label preview.

The Sheet milestone will consume these settings later; v0.3 focuses on loading data and previewing fields on one label.

### 7.2 Data input

Supported local inputs:

- CSV file selection.
- CSV / TSV drag and drop.
- Tab-separated or comma-separated table text pasted from spreadsheet software.

File decoding supports UTF-8, UTF-8 BOM, and Shift_JIS. Auto detection prefers a valid UTF-8 decode and falls back to Shift_JIS; users can manually override the detected encoding for loaded files.

### 7.3 Parsing and headers

CSV parsing supports quoted fields, embedded delimiters, escaped double quotes, and embedded line breaks. TSV is selected automatically when tabs dominate the first row.

The first row is used as column names. Empty or duplicate names are normalized without discarding source columns, for example `column_3` and `name_2`.

### 7.4 Data preview and row navigation

After loading data, show:

- source name or “Pasted data”,
- row count and column count,
- a compact table preview,
- previous / next row controls,
- direct row-number input.

Changing the preview row immediately updates field-backed text elements on the label canvas.

### 7.5 Field-backed text elements

Loaded columns can be added as text elements. A text element stores either:

- `sourceType: fixed` with literal `text`, or
- `sourceType: field` with `fieldName`.

Field-backed elements keep the same move, resize, typography, layering, and Undo / Redo behavior as fixed text. The inspector can switch an element between fixed text and a loaded field.

### 7.6 v0.3 exclusions

- XLSX and direct Google Sheets access.
- Images referenced by CSV URLs or file paths.
- Per-row print quantities.
- QR or barcode generation from fields.
- Sheet composition and PDF output.
- Persistent project save/restore.

### 7.7 v0.3 acceptance criteria

- UTF-8 and Shift_JIS CSV files can be loaded locally.
- Spreadsheet-style pasted TSV can be parsed without network access.
- Quoted CSV fields containing commas and line breaks parse correctly.
- Duplicate/empty headers remain addressable with normalized unique names.
- Loaded columns can be added to the label as field-backed elements.
- Changing the preview row changes field-backed text without changing element geometry.
- Fixed text continues to render independently of the active row.
- Repeat mode stores a label count between 1 and 10,000 for the current session.
- Drag and drop does not replace or remove existing label elements.
- v0.1 and v0.2 regression tests continue to pass.

## 8. v0.4.0 — Image / QR / Barcode

### 8.1 Image elements

Local PNG, JPEG, and WebP files can be added to the one-label editor. Images are read into the current browser session as data URLs and are not fetched or uploaded. Each image stores intrinsic pixel dimensions plus physical X/Y/width/height geometry. Display mode is either `contain` (show the full image) or `cover` (fill the frame). SVG image import remains out of scope for v1.0.

### 8.2 QR Code elements

QR elements use an embedded UTF-8 byte-mode encoder and render as SVG modules with a standard four-module quiet zone. Error correction is fixed to Medium in v0.4.0. Values may be literal text or a loaded data field. QR symbols smaller than 15 mm on either side receive a readability warning rather than being blocked.

### 8.3 Linear barcodes

Code 128 uses Code Set B and accepts printable ASCII characters (U+0020 through U+007E) in v0.4.0. Code 39 accepts uppercase letters, digits, space, and the standard `- . $ / + %` symbols. Invalid values remain visible as an editor error and are not rendered as a plausible barcode. Human-readable text can be toggled for linear barcodes.

### 8.4 Shared editor behavior

Text, image, QR, and barcode elements share physical geometry, selection, drag, four-corner resize, duplicate, front/back ordering, delete, and Undo / Redo behavior. Image and code elements are vector/layout objects in the editor rather than pre-rendered screenshots; QR and barcode marks remain vector SVG geometry.

### 8.5 v0.4 exclusions

- JAN / EAN / GTIN issuance or validation.
- Code 128 Code Sets A/C and automatic set switching.
- Image editing, cropping, filters, SVG image import, and remote image URLs.
- Camera-based label or barcode recognition.
- Sheet composition and PDF output.
- Persistent project save/restore.

### 8.6 v0.4 acceptance criteria

- PNG, JPEG, and WebP files can be added without network access.
- Unsupported image formats show a clear error.
- QR generation accepts UTF-8 Japanese text and produces a deterministic matrix.
- QR, Code 128, and Code 39 can use fixed values or the active data-row field.
- Invalid Code 128 / Code 39 values do not render a plausible code.
- QR symbols below the recommended physical size show a warning.
- All new element types retain shared move/resize/layer/Undo behavior.
- QR Code trademark wording appears in Help/documentation.
- v0.1 through v0.3 regression tests continue to pass.


## 9. v0.5.0 — Sheet Composition / Used Labels

### 9.1 Full-sheet composition

The Sheet step renders the configured physical paper and every label position using the same millimetre geometry as Paper. Assigned labels reuse the one-label renderer, including fixed text, merged fields, local images, QR codes, Code 128, and Code 39.

### 9.2 Used positions on the first sheet

Only page 1 can be marked as partially used. Each label position can be toggled between available and already used by click/tap or keyboard activation. Used positions are skipped while keeping the source item order unchanged. Controls are provided to mark all positions available, mark all used with confirmation, or invert the selection.

Used positions are a manual user choice. v0.5.0 does not use camera input, image recognition, or automatic detection of removed labels.

### 9.3 Fill order and multiple pages

Available positions fill left-to-right and top-to-bottom according to the configured grid. In repeat mode the requested repeat count is the item count. In merge mode the loaded data-row count is the item count. If page 1 does not have enough available positions, remaining items continue on page 2. Page 2 and later are treated as fresh sheets with every position available.

The UI reports total labels, page count, first-sheet used count, assigned labels per page, and the current page number. A merge-mode warning appears when no data rows are loaded. An empty-label warning appears when placement exists but the label contains no elements.

### 9.4 Accessibility and interaction

First-page sheet positions are keyboard focusable buttons in the SVG preview and support Enter / Space toggling. Used positions are indicated by both hatch/cross marks and colour, not colour alone. Smartphone users can tap the same positions directly.

### 9.5 v0.5 exclusions

- Print-ready PDF output and calibration.
- Per-page used-position maps after page 1.
- Camera/image recognition of used labels.
- Persistent project save/restore.

### 9.6 v0.5 acceptance criteria

- Used first-page positions can be toggled individually.
- Mark-all-available, mark-all-used, and invert-selection actions work.
- Used positions never receive an assigned item.
- Repeat mode keeps the requested item count across pages.
- Merge mode preserves source row order while skipping used positions.
- Page 2 and later contain no inherited used positions.
- Sheet preview renders text, images, QR codes, and linear barcodes without external network access.
- v0.1 through v0.4 regression tests continue to pass.


## 10. v0.7.0 — Project Save / Restore

The app can export the current job as one `.labelsheet.json` file and reopen it later without a server. The project file uses `schemaVersion: 1` and records the producing `appVersion` plus a save timestamp.

Saved content includes paper geometry, every label element, embedded local image Data URLs, parsed merge headers and rows, repeat/merge mode, current merge row, first-sheet used positions, X/Y print calibration, and the print-PDF filename. Browser-only named paper-layout and calibration preset collections remain device-local and are not copied into the project.

Projects can be opened through the file picker or by dropping the file onto the dedicated project bar. Restore replaces the current working state, resets Undo / Redo history to the restored label state, clears any previously generated PDF Blob, and returns to the Paper step.

Invalid JSON, unsupported schema versions, and structurally incomplete files are rejected with separate user-facing errors. The loader does not silently reinterpret an unknown future schema. All project serialization and parsing stays local and adds no network permission.

### v0.7 acceptance criteria

- A project round-trip preserves paper dimensions, text/media/code elements, embedded image data, merge rows, used positions, offsets, and output filename.
- `.labelsheet.json` files can be opened by file picker and drag & drop.
- Image elements remain self-contained in the project file.
- Duplicate/invalid used-position entries are normalized on load.
- Invalid JSON, unsupported schema, and incomplete project files fail clearly.
- Restoring a project does not restore a stale generated PDF Blob.
- v0.1 through v0.6 tests continue to pass.

## 10.1 v0.8.0 — Mobile / UX / Accessibility

### v0.9.0 refinement

- Double-clicking a fixed text element focuses the text editor and selects the complete value.
- Double-clicking a merge-data text element focuses its field selector instead of converting it to fixed text.


The label editor uses common direct-manipulation conventions. The full element frame is a move target and displays a move cursor, while the four corner handles use the corresponding diagonal resize cursors. Selecting an element focuses the label canvas so Delete / Backspace, Escape, Undo / Redo, and arrow-key movement work predictably even after editing inspector fields.

The most common selected-element actions — duplicate, bring front, send back, and delete — live beside the canvas as icon buttons rather than at the bottom of the inspector. These actions are disabled when nothing is selected and keep accessible labels/titles.

The font selector remains network-free and uses system/local font stacks. In addition to generic Gothic, Mincho, monospace, and system choices, v0.8 exposes Meiryo, Yu Gothic, Yu Mincho, Hiragino Kaku Gothic, Hiragino Mincho, and rounded-Gothic fallbacks. Missing fonts fall back locally; the app never downloads fonts.

Merge-data setup has a visible card in the Label tools plus a canvas-toolbar shortcut. Activating either entry switches to merge mode and moves the user directly to the CSV / TSV / pasted-table controls. Loaded row and column counts remain visible near the entry point.

### v0.8 acceptance criteria

- Clicking an element focuses the label canvas; Delete and Backspace remove the selected element.
- The full element frame shows a move cursor and corner handles show resize cursors.
- Duplicate / front / back / delete are reachable beside the canvas with SVG icons and accessible labels.
- Expanded font choices use only local/system font stacks and add no network permission.
- Merge data is discoverable without scrolling through the full inspector first, including on smartphone layouts.
- Existing v0.1 through v0.7 behavior and project-file compatibility remain intact.

## 10. v1.0 scope

Required by v1.0:

- A4 / Letter / custom paper
- mm / inch display
- generic presets and saved custom layouts
- constrained free-position label editor
- text, PNG/JPEG/WebP images, QR Code, Code 128, Code 39
- UTF-8 / UTF-8 BOM / Shift_JIS CSV
- pasted tabular data
- repeated identical labels and data merge
- manual used-label position selection
- multi-page composition
- X/Y print calibration in 0.1 mm increments
- calibration PDF
- print-ready PDF
- local project save/restore
- Undo / Redo
- Japanese / English
- desktop / smartphone
- single-file readable and self-extracting builds
- smartphone fixed selected-element action bar and touch long-press menu
- snap on/off with temporary Alt bypass during drag
- keyboard movement at 0.2 mm, or 1 mm with Shift

Not in v1.0:

- manufacturer product-code search
- manufacturer logos or official templates
- XLSX or Google Sheets integration
- JAN/EAN/GTIN issuance
- camera recognition of unused/used labels
- OCR or AI layout
- SVG image import
- cloud save, accounts, collaboration
- direct printer control

## 11. Intellectual-property guardrails

- Keep the app and built-in presets manufacturer-neutral.
- Do not display manufacturer logos.
- Do not call any built-in layout an “official” template.
- Do not ship a copied manufacturer template database in v1.0.
- Camera/image recognition of used label positions is explicitly out of scope.
- QR-related trademark notices must be added before the QR feature ships.

## 12. Accessibility

- Visible focus states.
- Keyboard-operable controls.
- Proper labels and `aria-label` for icon-only controls.
- State is never conveyed by colour alone.
- Smartphone tap targets are comfortably sized.
- Help dialog must scroll to the final item on short/narrow viewports.
- Respect `prefers-reduced-motion`.

## 13. Privacy and persistence

Browser storage holds language, display-unit preference, current paper geometry, user-saved layout presets, and saved printer-calibration presets when available. v0.7.0 adds explicit `.labelsheet.json` project files for portable local persistence of label elements, loaded merge data, embedded image data URLs, used positions, and output settings.

No data is sent by the app.

Browser storage can be cleared by the browser or user; this limitation must be explained in Help.

## 14. v0.1.0 acceptance criteria

- A4 and Letter exact dimensions load correctly.
- Custom paper dimensions are editable.
- mm/in switching preserves physical dimensions.
- At least three manufacturer-neutral built-in presets are available.
- Live preview displays the expected number and positions of labels.
- Invalid/overflowing layouts show a clear error and are not reported as ready.
- Right and bottom margins update from geometry.
- Current settings can be saved as a named local preset and restored.
- Saved presets can be deleted after confirmation.
- Japanese and English switch correctly.
- Four workflow destinations exist on desktop and smartphone.
- Smartphone layout has no document-level horizontal overflow.
- `connect-src 'none'` is preserved.
- No runtime external resource URL is added.
- Both standalone release variants are generated and verified before release.


## 10. v0.6.0 — PDF Output / Print Calibration

The Output step provides a final page preview using the same sheet composition as printing. Users can shift the complete print content by -10.0 mm to +10.0 mm on X and Y in 0.1 mm steps and save named calibration presets locally.

A calibration PDF contains label outlines, center marks, and slot numbers. Print-ready PDFs rasterize each page at 300 dpi equivalent and embed the result as one JPEG image per physical PDF page, prioritizing print appearance and Japanese text reproduction over searchable PDF text. Pages are processed sequentially to limit peak memory.

Printing guidance explicitly instructs users to choose Actual Size / 100% and avoid automatic scaling. PDF generation, calibration, images, and user data remain fully local.

### v1.0.0 stable editor UX

- Smartphone selection action bar fixed above the workflow navigation.
- Snap guide on/off control, with Alt temporarily bypassing snap during drag.
- Arrow-key nudge remains 0.2 mm; Shift + Arrow uses 1 mm.
- Touch long-press opens the selected element actions without replacing normal drag.
- Existing double-click edit, delete Undo, enlarged touch resize targets, merge-data entry points, and local/system fonts remain available.
