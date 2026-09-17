# Label Sheet Maker Development Plan

This roadmap implements the approved Browser Kitty product specification in small, testable milestones.

## v0.1.0 — Paper Layout / App Foundation ✅

- Four-step workflow shell
- A4 / Letter / custom paper
- mm / inch display
- Manufacturer-neutral generic presets
- Live sheet preview
- Geometry validation
- Named local paper-layout presets
- Japanese / English
- Desktop / smartphone foundation

## v0.2.0 — Label Editor ✅

- One-label editing canvas
- Text elements
- Move / resize / duplicate / delete
- Typography basics
- Constrained label bounds
- Undo / Redo
- Keyboard and touch editing foundations

## v0.3.0 — Data Merge ✅

- UTF-8 / BOM / Shift_JIS CSV
- Pasted tabular data
- Field mapping
- Row preview navigation
- Repeated-label and data-merge modes

## v0.4.0 — Image / QR / Barcode ✅

- PNG / JPEG / WebP
- QR Code
- Code 128
- Code 39
- Fixed values and mapped data fields
- Validation and minimum-size warnings

## v0.5.0 — Sheet Composition / Used Labels ✅

- Full-sheet composition
- Manual used-position selection
- Fill only available positions
- Multi-page calculation
- First-page partial-sheet behavior

## v0.6.0 — PDF Output / Print Calibration ✅

- Final page preview
- User-editable output filename
- Print-ready PDF
- X/Y offset calibration at 0.1 mm
- Calibration PDF
- Page-by-page rendering and progress states

## v0.7.0 — Project Save / Restore ✅

- `.labelsheet.json`
- Embedded local images and data
- Schema versioning
- Restore validation and error states

## v0.8.0 — Mobile / UX / Accessibility ✅

### v0.8.1 — Direct text editing

- Double-click fixed text to focus the text editor and select the full value.
- Preserve merge-data bindings by focusing the field selector for data-driven text.


- Smartphone editing polish
- Canvas focus and Delete / Backspace reliability
- Move / resize cursor affordances
- Contextual icon actions near the canvas
- Expanded local/system font choices
- Clear merge-data entry points
- Safe-area and software-keyboard handling
- Empty / loading / success / warning / error states
- Keyboard, focus, ARIA, and colour-independent status review

## v0.9.0 — Release Candidate / Regression

- Large-data regression
- PC / smartphone
- Japanese / English
- CSP / no-runtime-network verification
- README / screenshots / icon / standalone release checks
- Intellectual-property guardrail review

## v1.0.0 — Stable Release ✅

The complete workflow must work without a server:

Paper → Label → Data → Sheet → Calibration → Print-ready PDF.

v1.0 explicitly excludes manufacturer product-code databases, manufacturer logos/official templates, XLSX/Google Sheets integration, JAN/EAN issuance, camera recognition of used labels, OCR/AI layout, cloud save, accounts, and direct printer control.

### v0.9.0 — Release Candidate / Regression

- Freeze feature scope.
- Run desktop/mobile and Japanese/English regression.
- Verify project save/restore, sheet composition, PDF output, CSP, runtime network isolation, and standalone/self-extract builds.

### v1.0.0 — Stable Release finalization

- Fixed mobile selected-element action bar.
- Snap on/off control plus temporary Alt bypass.
- 0.2 mm arrow nudge / 1 mm Shift+Arrow nudge.
- Touch long-press element action menu.
- Final desktop/mobile, Japanese/English, standalone, CSP, project, sheet, and PDF regression.
