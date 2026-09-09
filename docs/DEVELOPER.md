# ALLAMA ABSOLUTE Developer Guide

## Stack

The browser shell uses React, TypeScript, Vite and Vitest. Deterministic astronomy uses SunCalc for rise and set timing and Astronomy Engine for geocentric celestial positions.

## Core modules

The src/core directory is deliberately framework-light. Computation can be tested independently of React.

Important entry points:

- raml.ts: deterministic shield mathematics.
- tapcast.ts: manual sixteen-line casting state machine.
- reverse.ts: ancestry trace.
- question.ts and universe.ts: question routing and 777-universe retrieval.
- analysis.ts: Omega orchestration.
- abjad.ts: Arabic normalization and Abjad arithmetic.
- celestial.ts and ephemeris.ts: time and astronomical calculations.
- rules.ts, traditions.ts and council.ts: rule and school deliberation.
- experiments.ts, blindTrials.ts and experimentsStats.ts: experimental integrity.
- calibration.ts, outcomes.ts, errorAutopsy.ts and ruleSurvival.ts: empirical feedback.
- security.ts and backup.ts: encrypted backup primitives.
- ai.ts: optional OpenAI-compatible provider boundary.

## Evidence separation

Do not add an interpretive claim to deterministic objects. Traditional claims should enter as explicit rule or evidence objects with provenance. AI output must remain a separate synthesis layer.

## Tests

Run npm test. Run npm run build for TypeScript plus production bundling. Run npm run audit for requirement coverage and forbidden-marker checks.

## Completion audit

audit/implementation-map.json maps every Roman-numbered specification section to core, partial or pending, plus evidence paths. scripts/audit.mjs verifies those evidence paths and writes completion-audit.generated.json.

Core means an executable core capability exists. It does not automatically mean every UI, provenance dataset, performance threshold, migration path, or acceptance criterion in that specification section is complete.

## Security

Never hard-code provider keys. The AI provider accepts keys through runtime configuration only. Encrypted backups use PBKDF2-SHA256 key derivation and AES-GCM authenticated encryption.

## Recasts

A case repository must require a written reason when a new cast supersedes an existing cast. Historical casts are not overwritten.

## Methodology versions

Rules carry explicit versions. Prediction snapshots record a methodology version. Outcome review must not mutate the historical version after the outcome is known.
