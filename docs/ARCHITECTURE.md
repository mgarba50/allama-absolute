# ALLAMA ABSOLUTE Architecture

## Architectural invariant

The system keeps four evidence classes separate from input to report:

1. deterministic computation;
2. traditional or esoteric interpretation;
3. optional AI synthesis;
4. empirical outcome evidence.

A deterministic value must not silently acquire traditional meaning, an AI sentence must not become source evidence, and an internal confidence score must not be presented as empirical probability. This is both a methodological rule and an architectural boundary.

## Runtime shape

The current delivery is a single-page React application built with Vite. It has no required application server and no required AI service.

```text
React practitioner surfaces
        │
        ├── framework-light TypeScript core ── deterministic/traditional/research results
        │
        ├── sql.js SQLite database in memory
        │           └── serialized bytes ── IndexedDB (origin-scoped persistence)
        │
        ├── Web Crypto ── entropy, SHA-256 locks, encrypted methodology export
        │
        ├── SunCalc / Astronomy Engine ── celestial calculations
        │
        └── optional fetch ── loopback OpenAI-compatible local model
```

Production builds register `public/sw.js`. The service worker is network-first for GET requests and caches successful responses for offline fallback. It does not turn the application into a native desktop or mobile package.

## Repository structure

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Application shell, navigation, top-level workspace state, English/Arabic direction switching |
| `src/components/` | Practitioner surfaces: analysis, casting, cases, research, graphs, timing, settings |
| `src/core/` | Framework-light calculation, interpretation, persistence, export, AI, and research APIs |
| `src/core/index.ts` | Public barrel for core consumers and tests |
| `database/schema.sql` | Idempotent SQLite schema and indexes, currently `user_version = 4` |
| `tests/` | Unit, invariant, known-answer, persistence, behavior, and research-discipline tests |
| `public/` | Web manifest and production service worker |
| `scripts/audit.mjs` | Evidence-path and forbidden-marker completion audit |
| `audit/implementation-map.json` | Roman-section implementation status and evidence map |
| `ABSOLUTE_777_UNIVERSE.*` | 777-question domain corpus |
| `ABSOLUTE_TEST_CASES.json` | Architecture test corpus derived from the question universe |
| `ALLAMA_ABSOLUTE_MASTER_SPEC.md` | Product directive and acceptance target |

## Core execution path

`runAbsoluteAnalysis()` is the main calculation boundary. It accepts a question, exactly four Mother IDs, an optional timestamp, optional coordinates, and optional Abjad texts.

It performs the following steps without network access:

1. resolve the four Mother records;
2. generate and validate the shield;
3. classify the question and route houses/modules;
4. calculate migration, mirrors, and element distribution;
5. create labelled traditional evidence from the Judge, Witnesses, and Reconciler;
6. synthesize the baseline traditional verdict and contradiction summary;
7. calculate optional Abjad records;
8. calculate optional planetary-hour and Moon-illumination context;
9. return a structured `AbsoluteAnalysis` with a data-quality score and any high-stakes boundary.

`runDeepSearch()` adds ranked findings across locally available dimensions. It attenuates findings that share an `independenceKey` so correlated derivations are not counted as fully independent confirmations. `runHundredPerspectiveCouncil()` applies the current deterministic perspective catalogue. `buildFinalVerdict()` assembles a final structured object without changing the underlying evidence classes. The UI then renders direct-response modes and reports from those structures.

Neither “Deep Search” nor the analytical council accesses the web. Optional manuscript parallels, configured schools/rules, historical cases, or calibration data appear only when callers actually supply them.

## Deterministic Raml model

`figures.ts` encodes all 16 patterns as immutable figure records. Each pattern contains four values constrained to one or two points.

`raml.ts` defines parity addition:

- equal inputs (`1+1` or `2+2`) produce `2`;
- unequal inputs (`1+2` or `2+1`) produce `1`.

Given four Mothers, Daughter transposition and every Niece/Witness/Judge/Reconciler dependency are fixed. `generateShield()` also emits a lineage ledger. `validateShield()` recomputes the derived figures and checks even Judge point parity. `reverse.ts` reconstructs Judge-line ancestry from this dependency graph.

Input creation is intentionally separate:

- `tapcast.ts` is an immutable 16-line tap-session state machine;
- `entropyMothers()` uses `crypto.getRandomValues`;
- direct IDs can represent an external or paper cast.

Randomness ends at Mother creation. Derivation never calls an entropy source.

## Deterministic Abjad model

`abjad.ts` exposes:

- `normalizeArabic()` with an explicit `ArabicNormalizationOptions` object;
- the current `ABJAD_KABIR` mapping;
- a per-character calculation ledger;
- repeated decimal digit reduction;
- configurable modulus analysis.

Defaults remove diacritics/tatweel, unify common Alif and Ya variants, map Hamza-on-Waw to Waw, retain Ta Marbuta without converting it, and keep only mapped Arabic letters plus Ta Marbuta. Because the standard mapping has no separate Ta Marbuta entry, retained `ة` contributes zero unless a caller selects `taMarbutaAsHa: true`. This behavior is deterministic and should be recorded as part of the methodology.

## Celestial model and limits

`celestial.ts` uses SunCalc for solar boundaries and lunar illumination. Daylight and night are independently divided into 12 unequal planetary hours. Weekday rulers seed the Chaldean sequence. `currentPlanetaryHour()` checks the requested day and the previous day so post-midnight moments before sunrise can resolve to the preceding night.

`ephemeris.ts` uses Astronomy Engine for geocentric positions of the Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn. The Moon path uses `EclipticGeoMoon`; other bodies use a geocentric vector converted to ecliptic coordinates. Positions are cached by body and ISO timestamp. Zodiac indices divide ecliptic longitude into 12 equal 30-degree regions. Lunar mansions use an explicitly labelled equal-arc 28-part model; the label prevents it from being confused with other traditional mansion boundaries.

Solar known-answer tests compare SunCalc to published USNO annual rise/set tables with a ±6-minute tolerance. Independent JPL Moon-longitude fixtures have not been added because the canonical Horizons API request timed out in the available environment. The code records that as a data blocker rather than validating Astronomy Engine against itself.

The browser’s `datetime-local` control has no zone identifier, and JavaScript parses it in the browser’s local zone. Reproducible studies should store/communicate the resulting UTC instant and the intended location/time zone. Polar conditions can produce unavailable solar boundaries, in which case analysis returns no celestial context instead of inventing one.

## Traditional rule and provenance layer

Traditional meaning is represented by labelled data and explicit structures:

- `Evidence` carries source class, direction, weight, reliability, and label;
- `VersionedRule` carries an ID, version, enabled state, school, conditions, weight, optional provenance, and signed result;
- `evaluateRules()` returns matched state, failed conditions, and contribution;
- `analyzeSchools()` evaluates rules per school without merging disagreements;
- `ProvenanceSource` and `ProvenancedClaim` validate source references and certainty labels;
- `CorrespondenceRegistry` stores versioned, optionally provenanced records and invalidates its lookup cache on mutation.

The initial baseline verdict is deliberately narrow: configured qualities for the Judge, two Witnesses, and Reconciler become traditional evidence. Celestial values and Abjad residues do not acquire directional meaning unless a rule explicitly supplies it.

## Research and calibration layer

Prediction snapshots carry a methodology version and frozen evidence. Outcomes are separate records. Binary scoring accepts only a YES/NO prediction paired with a resolved binary outcome. Research helpers then provide accuracy, Wilson intervals, Brier score when probabilities are supplied, confidence bins, performance by category, historical accuracy, figure frequencies, subsystem ablation, method tournaments, human-versus-system comparisons, rule survival, and error autopsies.

SHA-256 blind locks bind `createdAt` plus the serialized payload. Reveal data is stored separately in blind-session workflows. A lock detects later payload changes; it is not an external timestamp or proof that a participant lacked prior knowledge.

The remote-state module consumes explicit rule votes and ranks hypotheses. Its boundary string prohibits representing output as direct perception, GPS measurement, verified observation, mind reading, or proof.

## SQLite and IndexedDB persistence

`SqliteCaseRepository` is the authoritative long-term case repository. The previous localStorage description is obsolete.

At open time:

1. `sql.js` loads the bundled WebAssembly runtime;
2. `IndexedDbSqliteStore` reads a serialized database from IndexedDB, if present;
3. SQLite opens those bytes or creates an empty database;
4. legacy columns are prepared where necessary;
5. `database/schema.sql` runs idempotently;
6. schema version 4 is recorded;
7. figure, house, Abjad, lunar-mansion, and planetary-hour reference records are seeded;
8. the database is serialized back to the byte store.

Every repository write flushes a complete SQLite byte image to the byte store. The default IndexedDB identifiers are `allama-absolute` / `files` / `main.sqlite`. A custom `SqliteByteStore` can be injected for tests or another host, but no native filesystem store ships in this browser delivery.

Schema groups include:

- identity and case history: `users`, `cases`, `casts`, `practitioner_notes`, `practitioner_overrides`;
- analysis history: `predictions`, `outcomes`, `celestial_data`, `calibration`, `experiment_trials`;
- methods and configuration: `rules`, `schools`, `methodology_profiles`, `app_settings`, `protocol_bookmarks`;
- source/provenance material: `sources`, `documents`, `annotations`;
- reference tables: `figures`, `houses`, `correspondence_tables`, `abjad_methods`;
- migration bookkeeping: `schema_migrations`.

Some schema tables are architectural storage targets without a complete UI workflow yet; the presence of a table is not evidence that manuscript ingestion, source annotation, or every rule-management screen is complete.

Full database import validates SQLite integrity before replacement, runs current schema/migration/reference seeding on the replacement, validates again, and restores the prior in-memory handle if that process fails. It replaces rather than merges. SQLite integrity is a structural check, not content authenticity validation.

## Export and cryptography boundaries

The application has several deliberately different export paths:

- case bundles are versioned plaintext JSON containing one case and its operational records;
- full-database export returns plaintext SQLite bytes;
- shield, scholar, and client exports are plaintext JSON/Markdown/HTML;
- methodology-profile export uses PBKDF2-SHA256 (250,000 iterations, random 16-byte salt) to derive an AES-256-GCM key with a random 12-byte IV.

The encrypted export currently protects only the methodology profile. `backup.ts` also defines and validates a general versioned backup-envelope shape, but the Case Vault does not currently assemble and encrypt a full-database envelope. Documentation and UI must not call the raw `.sqlite` download an encrypted backup.

## AI boundary and network behavior

`AiProvider` is a minimal interface: an ID, model name, and asynchronous `complete()` method. `OpenAiCompatibleProvider` sends `/chat/completions` requests with temperature 0.2 and an optional bearer key. `analysisMessages()` serializes already-calculated data and instructs a model not to invent figures, arithmetic, sources, outcomes, or observations.

`createLocalAiProvider()` is the UI-safe constructor. It accepts only loopback host forms (`localhost`, `127.0.0.1`, `[::1]`) and requires an explicit model name. The current Settings UI only performs a connectivity test and holds endpoint/model state in memory.

The main deterministic workflow makes no AI request. Two other network facts matter for privacy:

- `src/styles.css` imports Google Fonts, so a browser may request those font resources when online;
- the production service worker fetches GET requests network-first and caches successful responses.

There is no telemetry, account synchronization, or cloud database implementation in this repository.

## Internationalization and RTL

`i18n.ts` defines the shared locale type, navigation labels, and direction. `App.tsx` sets `document.documentElement.lang` and `dir`. CSS swaps the desktop navigation rail, border sides, and text alignment under `html[dir="rtl"]`; reports also emit matching `lang` and `dir` attributes.

Component-local English/Arabic dictionaries cover the main practitioner workflows. Core domain identifiers, Latin figure names, some analytical rationales, and lower-level error strings remain English. The implementation therefore provides genuine layout directionality and substantial bilingual coverage without claiming every generated string is translated.

## Extension architecture

There is currently no dynamic runtime plugin discovery, sandbox, manifest loader, or third-party package installer inside the application. Extensibility is provided through typed core interfaces and data registries:

- implement `AiProvider` for another model transport;
- implement `SqliteByteStore` for another persistence host;
- supply `VersionedRule[]` and `TraditionSchool[]` to the rule/deep-search APIs;
- populate `CorrespondenceRegistry` with versioned provenanced records;
- use `ManuscriptIndex` for small in-memory lexical corpora;
- add protocol families and question coverage through the protocol modules;
- add research metrics as pure functions over explicit records.

Extensions should enter through `src/core/index.ts`, preserve evidence-class labels, use stable IDs and versions, invalidate caches after mutable registry changes, and include tests. A future dynamic plugin mechanism must add schema validation, capability declarations, migration/version rules, and an isolation/security model before untrusted plugins can be loaded.

## Deliberate non-claims and current gaps

- The delivery is browser-based; no Tauri shell or Capacitor wrapper is present.
- IndexedDB persistence is local to a browser origin and is not encrypted at rest by the application.
- Raw database, case, report, and shield exports are plaintext.
- SQLite FTS and embeddings are not wired into the live database workflow.
- `ManuscriptIndex` is an in-memory token-frequency search helper, not semantic retrieval.
- The Settings UI exposes loopback local AI testing, not a complete remote-provider secret-management screen.
- Independent numerical lunar-position/mansion fixtures are not yet present.
- An audit status of `core` means executable evidence exists; it does not mean every UI, dataset, migration, performance threshold, platform target, or acceptance criterion is complete.
