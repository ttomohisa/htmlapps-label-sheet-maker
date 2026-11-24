# Security Policy

## Supported version

Security fixes target the latest version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include:

- Affected commit or version.
- Reproduction steps.
- Expected and actual behavior.
- Security impact.
- A minimal test file when file parsing is involved.

## Trust model

Label Sheet Maker is a static browser application with no backend. Its primary protections are:

- No ordinary runtime CDN/API connection (`connect-src 'none'`). This app does not use WebRTC or server uploads.
- Explicitly pinned and embedded third-party files.
- Committed `dependencies.lock.json` tarball SHA-256 values verified before embedding.
- SHA-256 records in the generated dependency manifest.
- No analytics, telemetry, remote fonts, or silent update checks.
- User-initiated downloads rather than automatic uploads.

A generated HTML file is executable code. Distribute it through a trusted channel and verify hashes for high-trust workflows.

Opt-in recovery stores the full project, including images and merge data, in local browser storage. This is not encrypted by the app. Turning autosave off removes the recovery entry; exported project files and backups must be managed separately. Avoid enabling recovery on shared browser profiles.

## Input files

This app parses untrusted local CSV/TSV, images and project files. Maintenance should:

- Validate type, size, and structure before expensive processing.
- Avoid unbounded allocation or recursion.
- Handle malformed data without exposing stack traces to users.
- Release Blob URLs, workers, canvas resources, and large buffers.
- Make destructive transformations reversible where practical.
- Never upload a selected file unless the product explicitly requires it and the user is clearly informed.

## Dependency review

Before adding or upgrading a package:

- Confirm the package identity and exact version.
- Review the scheduled dependency Issue; never treat an available update as an automatic approval to upgrade.
- Review its license and required notices.
- Inspect the browser bundle and package scripts.
- Confirm every runtime support asset is embedded.
- Refresh the selected lock entry with the dependency scripts; never hand-edit a lock hash to bypass a mismatch.
- Rebuild with a clean cache.
- Test with the network disabled.

Project schema 2 includes optional quantity arrays, auto-fit, shape geometry and RGB color values, and additional barcode formats. Shape and text paint accept only six-digit hexadecimal RGB, never arbitrary SVG/CSS or remote URLs. Invalid quantity arrays are rejected. Barcode inputs are validated locally; neither the app nor the project format registers product identifiers.
