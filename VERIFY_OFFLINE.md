# Offline Verification — Label Sheet Maker

## v1.2.0 readable build

1. Run `build-standalone.bat` on Windows.
2. Open `dist/index.html` directly from the filesystem.
3. Enable browser offline mode or disconnect the device, then reload the local HTML.
4. Confirm Paper layout, mm/in switching, saved layouts, and validation still work.
5. In Label, add a text element and confirm the full frame shows a move cursor, corner handles show diagonal resize cursors, and clicking the element moves focus to the label canvas.
6. With an element selected, confirm the contextual icon actions above the canvas can duplicate, bring forward, send backward, and delete it. Confirm Delete / Backspace removes the selection and Esc deselects it.
7. Confirm the expanded local/system font list is available and changing the font updates the label without any font download.
8. Use both the canvas “Merge data” shortcut and the left-side data guide to reach CSV / TSV / pasted-table data merge; confirm row navigation and data-field insertion work.
9. Add PNG / JPEG / WebP, QR Code, Code 128, and Code 39 elements; confirm move, resize, duplicate, layering, Undo, and Redo still work.
10. In Sheet, mark arbitrary positions used and confirm placement skips those positions. Confirm page 2 and later are treated as fresh sheets.
11. In Output, set X/Y calibration values and confirm the final preview moves by the same offset.
12. Save a named calibration preset, reload it, and confirm its X/Y values are restored locally.
13. Create a calibration PDF and confirm it contains label outlines, center marks, and slot numbers.
14. Create a print-ready PDF and confirm Japanese text, images, QR/barcodes, used-position skipping, and multi-page placement match the preview.
15. Open generated PDFs and confirm A4 / Letter / custom physical page sizes are preserved. Print with “Actual size” / 100%.
16. Switch Japanese / English after PDF generation and confirm the completion card also changes language.
17. Save the current work as `.labelsheet.json`, change multiple settings, then reopen the project and confirm paper, elements, data, used positions, and output settings are restored.
18. Drop the same project file onto the project bar and confirm it restores. Confirm invalid JSON and unsupported `schemaVersion` files show clear errors.
19. At smartphone width, confirm the bottom navigation remains usable, the project controls remain reachable, and there is no document-level horizontal scroll.
20. Confirm the supplied favicon matches the upper-left app icon.
21. Confirm there are no unexpected external requests or console errors while editing, saving/restoring projects, or generating PDFs.

All user data and PDF generation remain local to the browser. The readable standalone does not require runtime network access.

## Self-extracting variant

1. Open `dist/index.self-extract.html` directly.
2. Confirm the loader uses the same favicon as the readable build.
3. Confirm the loader disappears and the restored app matches `dist/index.html`.
4. Repeat the readable-build core flow offline, including project save/restore, PDF calibration, and print-ready PDF generation.
5. Confirm the browser console contains no decompression or CSP error.

`scripts/verify-self-extract.ps1` verifies an ASCII-only loader and byte-for-byte restoration when the standard Windows build is run.

## v1.2.0 editor and recovery

- Select overlapping elements from Elements; replace a PNG/JPEG/WebP image and check frame geometry, ordering, and Undo.
- Fit the canvas at narrow and wide viewport sizes; check rounded dimension display does not change an untouched saved value.
- Load malformed CSV/TSV and confirm the previous data survives. Expand Import settings and try a manual delimiter.
- Drag across first-sheet positions, Undo, then navigate away or change language during a gesture. No incomplete selection may be committed. Check later-page scrolling.
- Run Check before printing against empty text, overflowing text, an invalid barcode, a missing field and an offset beyond the paper; select an issue to navigate to the relevant row/element.
- Verify autosave is off by default. Enable, reload, restore, then turn off and confirm the recovery entry is removed. Test quota/blocked storage, and a second tab changing the saved work during confirmation. Recovery is not a replacement for a portable project file.
- Repeat offline checks using normal and self-extracting release files. Record browser/device and results; a checklist is not evidence of a completed test.

## v1.3.0 batch labels

- Generate serial values 007, 009, 011 with prefix A-; bind to text and a QR/code. Confirm ascending/descending and invalid range handling.
- Apply quantities [2,0,3] manually and from a column; check five labels in order across used positions, page boundaries and print PDF. Reject blanks/fractions/negative counts without altering previous values; all-zero disables print PDF.
- Enable auto-fit on long text; check original size remains unchanged, effective size is smaller in all previews and PDF, and minimum-size overflow is reported. Verify Undo, project save/restore and language switching.
- Confirm all 33 presets produce valid layouts and match measured paper. Verify legacy schema-1 projects and new schema-2 roundtrip; run the same checks offline for both release variants.

### Design and new codes

- Add all shape kinds, set colors, geometry, layering and line direction; Undo, duplicate, save/reopen schema 2; confirm the same paint and shape in sheet preview and PDF.
- Check EAN-13, EAN-8, UPC-A and ITF with fixed data and CSV fields, valid/missing/incorrect check digits, leading zeros, skipped invalid rows, and invalid ITF length. Verify the generated printed symbols using independent scanners at realistic dimensions; this is a separate physical test.
