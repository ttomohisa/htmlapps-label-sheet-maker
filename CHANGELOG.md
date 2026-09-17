# Changelog

## [1.0.0] - 2026-09-17

### Added
- Added a smartphone-only fixed selection action bar above the workflow tabs for Edit, Duplicate, Bring Front, Send Back, and Delete.
- Added a Snap on/off control beside the safe-area control.
- Added Alt as a temporary snap bypass while dragging; Shift + Arrow continues to nudge by 1 mm while plain Arrow nudges by 0.2 mm.
- Added a touch long-press context menu for element editing, duplication, layer order, and deletion.

### Changed
- Long-press detection now waits for a stationary touch before opening the menu and cancels cleanly when the pointer starts dragging.
- Mobile page bottom padding and toast placement adapt when the fixed selection action bar is visible.
- Promoted the release candidate to the v1.0.0 stable release.

### Fixed
- Prevented the touch long-press release itself from activating a context-menu action by opening the menu away from the finger and delaying menu activation until after release.

## [0.9.0] - 2026-09-17

### Changed
- Promoted the app to the v0.9.0 release candidate.
- Froze major feature additions for final regression across desktop, mobile, Japanese, English, project files, sheet composition, and PDF output.
- Added dedicated regression coverage for the v0.8.2 mobile edit, delete Undo, touch resize hit targets, and snap guides.

### Fixed
- Restored the missing snap-guide state initialization and `SNAP_TOLERANCE_MM` constant so element dragging cannot fail at runtime.
- Fixed the standalone build artifact so the template-standard embedded asset bundle placeholder is always resolved, preventing startup from stopping before UI initialization.

## [0.8.2] - 2026-09-17

### Added
- Added a mobile text-edit action button that appears when a text element is selected.
- Added toast-based Undo after deleting an element.
- Added center and edge snap guides while moving elements on the label canvas.

### Changed
- Enlarged invisible resize hit targets so corner resizing is easier on touch devices.
- Updated in-app help and version references for v0.8.2.

## [0.8.1] - 2026-09-17

### Added

- Double-click a fixed text element on the label canvas to jump to the text editor and select the full value for immediate replacement.
- Double-click a merge-data text element to focus its data-field selector without breaking the field binding.

### Changed

- Help copy now documents direct text editing from the canvas.
- App version advanced to v0.8.1.

## [0.8.0] - 2026-09-17

### Added

- Contextual canvas toolbar with icon actions for duplicate, bring front, send back, and delete.
- Keyboard-focusable label canvas so Delete / Backspace and arrow-key editing work reliably after selecting an element.
- Move cursor across the full element frame plus resize cursors on the four corner handles.
- Additional local/system font choices: Meiryo, Yu Gothic, Yu Mincho, Hiragino Kaku Gothic, Hiragino Mincho, and rounded Gothic fallbacks.
- Clear merge-data entry points in both the label tools panel and canvas toolbar, with loaded row/column status.

### Changed

- Element actions moved out of the lower inspector section and next to the canvas where they are easier to reach.
- Merge-data setup now switches to merge mode and scrolls directly to the data source controls.
- Help and editor copy now describe the refined selection and data-merge workflow.
- App version advanced to v0.8.0.

All notable changes to this project are documented here.

## [0.7.0] - 2026-09-16

### Added

- Portable `.labelsheet.json` project files containing paper settings, label elements, embedded image data, parsed merge data, used first-sheet positions, and print output settings.
- Project open/save controls plus drag-and-drop project restore.
- `schemaVersion: 1` validation with separate errors for invalid JSON, unsupported schema versions, and incomplete project structure.
- Project restore resets editor history to the restored state and clears generated PDF blobs while keeping browser-only processing.

### Changed

- Help, README, specification, and roadmap now describe project save / restore.
- App version advanced to v0.7.0.

## [0.6.0] - 2026-09-16

### Added

- Final Output step with print summary and page-by-page preview.
- X/Y print calibration from -10.0 mm to +10.0 mm in 0.1 mm steps.
- Named calibration presets stored locally in the browser.
- One-page calibration PDF with label outlines, center marks, and slot numbers.
- 300 dpi page rasterization and a local PDF writer for print-ready output.
- A4, Letter, and custom physical PDF page sizes.
- Progress, success, save, and failure states for PDF generation.
- Editable PDF output filename and explicit 100% / Actual Size print guidance.

### Changed

- Output navigation is now a working step instead of a future placeholder.
- Final preview applies the same calibration offsets used in generated PDFs.
- Generated PDF completion details now re-render in the selected language after switching Japanese / English.
- README, Help, product specification, and roadmap now describe the v0.6.0 PDF Output milestone.

## [0.5.0] - 2026-09-16

### Added

- Full-sheet composition preview using the configured physical label geometry.
- Manual used-position toggles on the first sheet for partially used label stock.
- Mark-all-available, mark-all-used (with confirmation), and invert-selection actions.
- Automatic fill order that skips used positions while preserving repeat/data-merge order.
- Multi-page calculation with page 2 and later treated as fresh sheets.
- Page navigation, per-page placement status, and keyboard-operable sheet slots.

### Changed

- Sheet navigation is now a working step instead of a future placeholder.
- Shared label rendering now accepts explicit data rows so sheet previews can render merged rows accurately.
- README, Help, product specification, and roadmap now describe the v0.5.0 Sheet Composition milestone.

## [0.4.0] - 2026-09-16

### Added

- Local PNG / JPEG / WebP image elements with contain and cover fitting.
- UTF-8 QR Code generation rendered as SVG modules with a four-module quiet zone.
- Code 128 Set B and Code 39 barcode elements rendered as vector bars.
- Fixed values or loaded CSV / TSV fields as QR / barcode sources.
- Type-specific barcode validation and QR minimum-size warnings.
- Shared move, resize, duplicate, layering, and Undo / Redo behavior for text, image, QR, and barcode elements.
- QR Code trademark notice in Help and documentation.

### Changed

- Label editor and inspector now switch controls by element type.
- Product copy, Help, README, and specification now describe the v0.4.0 Image / QR / Barcode milestone.

## [0.3.0] - 2026-09-16

### Added

- UTF-8 / UTF-8 BOM / Shift_JIS CSV and TSV loading with automatic encoding detection and manual override.
- Drag & drop data-file loading plus pasted tabular data from spreadsheet software.
- CSV parser support for quoted delimiters, escaped quotes, and embedded line breaks.
- Unique normalization for duplicate or blank column names.
- Repeat-label and data-merge content modes.
- Compact data preview with row navigation.
- Data-field text elements that resolve the selected CSV/TSV column against the active preview row.
- Inspector controls for switching between fixed text and data fields.

### Changed

- Label editor copy, Help, README, and product specification now describe the v0.3.0 Data Merge milestone.
- Previous milestone tests now validate behavior independently from the current app version so regression suites remain reusable.

## [0.2.0] - 2026-09-16

### Added

- SVG one-label editor using physical label dimensions.
- Text elements with move, four-corner resize, duplicate, delete, bring-to-front, and send-to-back actions.
- Generic system font categories, point size, bold, horizontal/vertical alignment, and text wrapping.
- Direct X/Y/width/height editing in the current mm/in display unit.
- 50–300% canvas zoom, explicit pan mode, and safe-area guide.
- 50-step Undo / Redo history plus keyboard delete, nudge, and Escape selection clearing.
- Smartphone one-column editor foundation while preserving the four-tab workflow.
- New supplied canonical application icon reused by favicon and upper-left app icon.

### Changed

- Help, header copy, README, and product specification now describe the v0.2.0 Label Editor milestone.
- Paper-layout regression coverage remains active.

## [0.1.0] - 2026-09-16

### Added

- Initial Label Sheet Maker application foundation based on the latest Browser Kitty single-HTML template.
- Four-step Paper / Label / Sheet / Output workflow navigation.
- A4, Letter, and custom paper sizes.
- Millimetre and inch display modes with millimetre-based internal geometry.
- Manufacturer-neutral built-in label-sheet presets.
- Live SVG sheet preview with label numbering and calculated remaining margins.
- Layout validation for invalid dimensions and paper overflow.
- Named custom layout presets saved locally in the browser.
- Japanese and English UI.
- Smartphone bottom page tabs and safe-area-aware layout.
- Browser Kitty local-processing help and privacy copy.
