# Ω ALLAMA ABSOLUTE

Private, local-first Raml–Abjad–celestial research workbench for Musa Allama.

This repository contains a browser-runnable React/TypeScript implementation, the master specification, a 777-question architecture corpus, a normalized SQLite schema, and automated tests/audit tooling. It deliberately keeps deterministic calculation, traditional interpretation, optional AI synthesis, and empirical outcome evidence as separate layers.

> **Epistemic boundary:** the application computes reproducible symbolic structures and supports disciplined research. A traditional confidence score is a configured testimony index, not a scientifically calibrated probability. Outputs are not a substitute for medical, legal, financial, safety, or emergency professionals.

## Install and run

Prerequisites:

- Node.js supported by the installed Vite 7 toolchain (Node 20.19+ or 22.12+ is recommended);
- npm;
- a modern browser with Web Crypto, IndexedDB, and WebAssembly enabled.

```bash
npm ci
npm run dev
```

Use `npm install` only when intentionally changing dependencies and regenerating `package-lock.json`.

Vite is configured to start on port `4173` when that port is available. Use the URL printed by the terminal.

For a production build:

```bash
npm run build
```

The build output is written to `dist/`. A production build registers the included service worker when served from an origin that permits service workers.

## Verify the repository

Run the complete local verification pipeline with one command:

```bash
npm run verify
```

It runs, in order:

1. TypeScript type-checking (`npm run typecheck`);
2. the Vitest suite (`npm test`);
3. the Vite production build (`npm run build:app`);
4. the requirement/evidence audit (`npm run audit`).

Useful focused commands are `npm run test:db` for the SQLite tests and `npm run test:watch` while developing.

## What is implemented

- all 16 geomantic figures and four-line patterns;
- manual 16-line blind tapping, direct Mother selection, and Web Crypto entropy casting;
- deterministic Mothers → Daughters → Nieces → Witnesses → Judge → Reconciler derivation, validation, and reverse ancestry;
- question classification, relevant-house routing, 777-question protocol coverage, significators, deep-search findings, contradiction checks, and a deterministic 100-perspective council;
- configurable Arabic normalization, Abjad al-Kabir totals, digit reduction, and modulus helpers;
- sunrise/sunset planetary hours, lunar illumination, Astronomy Engine geocentric classical-body positions, and an explicitly labelled equal-arc 28-mansion index;
- a live SQLite database in the browser through `sql.js`, persisted as SQLite bytes in IndexedDB;
- cases, casts/recasts, notes, prediction snapshots, outcomes, practitioner overrides, calibration snapshots, research trials, methodology profiles, settings, and protocol bookmarks;
- case JSON, shield JSON, scholar Markdown, client HTML, raw SQLite database, and encrypted methodology-profile exports;
- English/Arabic navigation and content with document-level LTR/RTL switching;
- optional loopback-only OpenAI-compatible local-model connectivity for Ollama or LM Studio;
- blind prediction locks, outcome comparison, Wilson intervals, calibration bins, rule survival, ablation, method tournaments, and error-autopsy primitives.

## Data, backups, and privacy at a glance

The Case Vault is not a mock or localStorage shell. `sql.js` runs SQLite in the browser and saves the serialized database to IndexedDB under the current web origin. Data does not automatically synchronize between browsers, profiles, devices, hostnames, or ports.

Use **Case Vault → Export SQLite database** for a full operational backup before clearing browser data or importing another database. That `.sqlite` file, case JSON exports, reports, and shield exports are **plaintext**. Store them accordingly. **Settings → Export encrypted profile** encrypts only the methodology profile with PBKDF2-SHA256 and AES-256-GCM; it is not an encrypted full-database backup.

The deterministic core and Case Vault require no AI provider. The stylesheet currently requests Google Fonts when network access is available, and the optional local-AI test sends its two test messages to the loopback endpoint you enter. See [Security and privacy](docs/SECURITY.md) for the complete data-flow description.

## Current limits worth knowing

- This repository is a Vite browser application; it does not currently ship a Tauri desktop package or a mobile wrapper.
- Local AI is an optional connectivity/provider boundary. The current UI tests a local endpoint; it does not make an AI response authoritative or replace deterministic calculations.
- Full-database encryption is not wired into the Case Vault. Raw SQLite import/export is plaintext.
- SQLite FTS and an embeddings-backed manuscript index are not wired into the live Case Vault. Case similarity is an in-memory lexical helper; `ManuscriptIndex` is a framework-light core primitive.
- Solar known-answer fixtures are independently checked against USNO tables. Independent lunar-longitude/mansion fixture values remain data-blocked because the canonical JPL Horizons API request timed out in the current environment; see [Astronomy validation](docs/ASTRONOMY_VALIDATION.md).
- The completion audit uses `core`, `partial`, and `pending` as evidence labels. `core` means an executable capability exists, not that every acceptance criterion or delivery target in the master specification is complete.

## Documentation map

- [User guide](docs/USER_GUIDE.md) — end-to-end operation, Case Vault, exports, local AI, Arabic/RTL, and troubleshooting.
- [Architecture](docs/ARCHITECTURE.md) — runtime layers, algorithms, persistence, trust boundaries, and current implementation limits.
- [Developer guide](docs/DEVELOPER.md) — repository structure, public APIs, schema, rule format, extension seams, commands, and tests.
- [Methodology](docs/METHODOLOGY.md) — evidence classes, research protocol, calibration, and no-fake-science rules.
- [Security and privacy](docs/SECURITY.md) — storage, network behavior, secrets, imports, encryption, and deletion.
- [Astronomy validation](docs/ASTRONOMY_VALIDATION.md) — independent references, fixtures, tolerances, and the recorded lunar blocker.

## Specification corpus

- `ALLAMA_ABSOLUTE_MASTER_SPEC.md`
- `ABSOLUTE_777_UNIVERSE.md`
- `ABSOLUTE_777_UNIVERSE.json`
- `ABSOLUTE_TEST_CASES.json`
- `audit/implementation-map.json`

The master specification remains the product directive. Executable code and tests describe what the current build actually does; the audit records where the implementation is still partial or pending.
