# Object centering and geometry reliability implementation plan

> For agentic workers: execute this bounded plan with TDD and independent whole-branch review.

Goal: Center one selected object frame precisely and protect committed geometry during incomplete numeric input and interrupted drags.

Architecture: Keep the single-HTML app, physical millimetres, existing clamp/history/PDF fingerprint paths, and schema 1. Add localized inspector commands and small input/interaction boundary helpers. Do not alter barcode algorithms, dependencies, quantities, permissions, or deployment settings.

Spec: APP_SPEC.md and the approved Label Sheet Maker geometry assessment.

## Review focus
- Fractional label bounds, resized full-size objects, and inch display must retain physical geometry.
- Repeated/no-selection commands must preserve history, redo, and generated PDF eligibility.
- Blank, whitespace, browser-sanitized malformed numbers, non-finite numbers and zero sizes must never coerce to geometry.
- Active focused drafts must survive unrelated rendering; selection and unit changes must discard stale field feedback.
- Late pointer events after history restore, reset, project load and selection cancellation must not overwrite the restored document.

## Task 1: Geometry controls and input reliability
- [x] Add source-event tests for centering every frame type, single-step Undo/Redo, no-ops, physical mm/in, invalid input rollback, focus and exact PDF invalidation.
- [x] Observe intended failures, then implement `centerSelectedElement(axis)`, `commitEditorGeometryInput(input)`, field-local feedback, and localized inspector controls in src/index.template.html.
- [x] Verify focused tests and baseline regressions.

## Task 2: Interaction ownership boundaries
- [x] Add failing tests for stale drag/resize events after Undo/Redo, reset, project replacement and clear selection, plus normal completion.
- [x] Implement `cancelEditorInteraction({restore=true})` and retire pointers/long press at history and document-context boundaries. No stale event may push history.
- [x] Verify both tasks and update APP_SPEC, README JA/EN, Help, CHANGELOG, app metadata, and release runner.

## Task 3: Review and release verification
- [x] Run PowerShell preflight and full repository check, checking root/readable/self-extract byte parity and all-variant tests.
- [x] Obtain independent review and resolve material findings with RED/GREEN tests.
- [ ] Recheck remote main/open PRs, publish a hash-verified feature branch and Draft PR, and inspect CI for its exact head. No merge, main write, production deployment, browser, CUA, file picker, printer or scanner claims.
