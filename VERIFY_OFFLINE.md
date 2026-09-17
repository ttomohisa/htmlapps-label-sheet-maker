# Offline Verification — Label Sheet Maker

## v0.8.0 readable build

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
4. Repeat the v0.8.0 core flow offline, including project save/restore, PDF calibration, and print-ready PDF generation.
5. Confirm the browser console contains no decompression or CSP error.

`scripts/verify-self-extract.ps1` verifies an ASCII-only loader and byte-for-byte restoration when the standard Windows build is run.
