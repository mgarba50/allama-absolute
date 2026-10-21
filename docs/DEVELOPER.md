# ALLAMA ABSOLUTE Developer Guide

## Run and verify

This is a React 19, TypeScript and Vite browser application. The deterministic core is in `src/core`; Vitest runs its tests. Astronomy calculations use SunCalc and Astronomy Engine. No application server, database service or environment variable is required for the default local workflow.

```sh
npm ci
npm run dev
npm run verify
```

`npm run verify` type-checks, runs the complete test suite, builds the app, checks the production bundle against the performance budget and runs the completion audit. For focused work, use `npm run typecheck`, `npm test`, `npm run test:db`, `npm run performance:budget` or `npm run audit`. `npm run audit:strict` additionally requires every mapped requirement to be either `core` or explicitly `data-blocked`; it is a release gate, not a substitute for behavioral tests.

## Code map

- `src/core/raml.ts`, `tapcast.ts` and `reverse.ts` implement figure mathematics, manual casting and ancestry traces.
- `question.ts`, `universe.ts` and `analysis.ts` route questions, retrieve the 777-universe context and assemble analysis.
- `abjad.ts`, `celestial.ts` and `ephemeris.ts` handle Arabic arithmetic and time-dependent astronomy.
- `rules.ts`, `traditions.ts` and `council.ts` evaluate versioned, school-linked interpretive rules. Keep those claims separate from computed values.
- `experiments.ts`, `blindTrials.ts` and `experimentsStats.ts` handle prediction locking, blinded sessions and trial summaries.
- `calibration.ts`, `outcomes.ts`, `errorAutopsy.ts` and `ruleSurvival.ts` implement post-outcome feedback.
- `security.ts` and `backup.ts` contain the encryption and backup primitives. `ai.ts` is the optional provider boundary.
- `src/core/sqlite.ts` implements the live `sql.js` repository and its IndexedDB byte store; `database/schema.sql` defines the normalized SQLite schema at `user_version = 4`.
- `src/components/`, `src/App.tsx` and `src/main.tsx` host the React interface. The service worker is registered in production builds.

## Persistence and extensions

The browser repository opens SQLite in WebAssembly, migrates legacy data to schema version 4, seeds reference tables and writes serialized database bytes to IndexedDB. The schema includes cases and casts, predictions and outcomes, schools and rules, sources and document metadata, annotations, experiments, calibration, settings and methodology profiles. Document records are metadata; `src/core/manuscripts.ts` is an in-memory text index, not a full-text SQLite corpus.

Use repository methods for case changes instead of editing the byte store directly. A new cast superseding a prior cast needs a recorded reason; preserve the old cast and the prediction's methodology version. Imports must pass integrity checks before replacing the active database. Keep schema migrations and persistence tests in step with any schema change.

Interpretive extensions are versioned rule data, not executable plugins. A `VersionedRule` has an ID, name, version, enabled flag, weight, school, optional provenance, path/operator/value conditions, and a result with direction `-1`, `0` or `1` plus label. `src/core/rules.ts` evaluates supported operators (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `includes`) against a context object. There is no general third-party plugin loader. New school claims should identify their provenance and expose disagreements rather than silently modifying deterministic calculations.

`src/core/ai.ts` defines an `AiProvider` and an OpenAI-compatible chat-completions adapter. The UI exposes local loopback presets; the adapter can be configured in code for another compatible endpoint. Core analysis must work with no provider. Do not ship remote credentials in browser assets, and do not allow AI prose to become a computed fact or an uncited source.

## Audit and evidence

`audit/implementation-map.json` maps specification sections to `core`, `partial`, `pending` or `data-blocked`, with evidence paths and (for data-blocked entries) blockers. `scripts/audit.mjs` checks status validity, evidence paths and forbidden-marker rules, then writes `completion-audit.generated.json`. `core` means executable core evidence exists; it does not by itself certify all UI paths, source data, performance or acceptance criteria. A strict audit can still fail while work remains, even when unit tests pass. Update the map only after verifying the corresponding behavior.
