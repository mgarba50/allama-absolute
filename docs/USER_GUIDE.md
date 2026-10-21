# ALLAMA ABSOLUTE User Guide

ALLAMA ABSOLUTE is a local-first symbolic-research workbench. The current delivery runs in a modern browser. It calculates Raml shields, Arabic Abjad values, celestial context, traditional evidence, and research statistics; it does not turn any of those layers into verified facts about the world.

## Start the application

From the repository root:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:4173`. Browser WebAssembly, IndexedDB, and Web Crypto must be enabled for the complete workflow.

Before relying on a checkout, run:

```bash
npm run verify
```

This type-checks, tests, builds, and audits the repository.

## Read every result in the correct evidence class

The interface intentionally separates:

1. **Deterministic computation** — reproducible arithmetic and transforms, such as shield derivation, Abjad totals, hashes, and celestial calculations.
2. **Traditional interpretation** — configured figure qualities, correspondences, rules, and testimony weights.
3. **AI synthesis** — optional prose produced by a separately configured model from already-calculated data.
4. **Empirical evidence** — statistics calculated only after predictions and outcomes have been recorded.

The traditional confidence score shown by Ω is a symbolic testimony index. It is not a scientific probability, even when displayed on a 0–100 scale. “Deep Search ×100” and the “100-Perspective Council” are deterministic internal analysis passes, not internet research and not 100 independent human experts.

## Recommended case workflow

1. Write one clear, testable question in **Question Intelligence**.
2. Produce four Mothers in **Casting Chamber** by blind tapping, direct selection, or cryptographic entropy.
3. Inspect **House Map**, **Reverse Judge**, and the derivation ledger if traceability matters.
4. Set the location and moment in **Celestial Intelligence** if celestial context is relevant.
5. Run **Ω Sovereign Analysis** and read supporting, contrary, and data-quality information together.
6. Create or select the case in **Case Vault**, save the cast, and capture a prediction snapshot before the outcome is known.
7. Record the resolved outcome later. Use **Research Laboratory** only after a real scorable sample exists.

The workspace state used by the analysis screens and the records stored in Case Vault are related but distinct. A cast is not archived until you explicitly save it to a selected case.

## Question Intelligence

Enter one operative question. The deterministic classifier normalizes whitespace, looks for configured domain terms, and consults the 777-question corpus for routing support. It returns a domain, decision type, relevant houses, modules, and notes.

Treat routing as a baseline, not comprehension equivalent to a human interview. Compound questions, allegations, vague timing, impossible certainty, or multiple actors can require the question-quality and practitioner workflow to clarify the question before interpretation. High-stakes health and legal categories carry an explicit boundary; no symbolic output is professional advice or verified evidence.

## Casting Chamber and shield mathematics

Three input paths are available:

- **Manual tapping:** complete 16 lines. Each line must receive at least one tap before it can be locked. A locked line becomes one point when the count is odd and two points when even. Blind mode hides the running count as designed by the tapping component.
- **Direct Mother selection:** select four of the 16 figures when entering a paper or externally generated cast.
- **Cryptographic Entropy Cast:** Web Crypto fills 16 random bytes and maps each byte’s low bit to one or two points.

Only Mother creation is random or human-entered. Everything after the four Mothers is deterministic:

- the four Daughters transpose the four Mother rows;
- Niece 1 = Mother 1 + Mother 2;
- Niece 2 = Mother 3 + Mother 4;
- Niece 3 = Daughter 1 + Daughter 2;
- Niece 4 = Daughter 3 + Daughter 4;
- Right Witness = Niece 1 + Niece 2;
- Left Witness = Niece 3 + Niece 4;
- Judge = Right Witness + Left Witness;
- Reconciler = Judge + Mother 1.

“+” is parity addition, not ordinary addition: equal line values produce two points and unequal line values produce one point. Structural validation recomputes derived figures and checks Judge parity. **Reverse Judge** traces each Judge line back through these dependencies.

**Export Shield JSON** downloads the current derived shield as plaintext JSON. It does not save it to Case Vault.

## Houses, graphs, and timing

- **House Map** displays the 12 houses and their current figure placements.
- **Reverse Judge** shows derivation ancestry by line.
- **Graph Laboratory** derives ancestry and house-network graph models from the current analysis.
- **Timing Explorer** compares supplied location/moment candidates and scans bounded windows using labelled traditional electional preferences.

Graph and timing scores describe the configured model. They are not measurements of causation or guaranteed event timing.

## Ω Sovereign Analysis

The baseline analysis currently combines:

- question routing and significators;
- shield validation, migration, mirrors, and element distribution;
- traditional evidence from Judge, both Witnesses, and Reconciler qualities;
- a contradiction penalty and traditional verdict;
- planetary-hour and lunar-illumination context when valid coordinates are supplied;
- deterministic deep-search findings and the 100-perspective analytical council;
- direct-response renderings for Sovereign, Scholar, Client, Musa, and Researcher modes.

Expand **Show calculation** to inspect the shield derivation ledger. A data-quality score reflects missing celestial context and structural errors; it is not evidence that a prediction is true. The council’s percentage is internal consensus across generated analytical perspectives, not empirical accuracy.

Exports from this screen:

- **Scholar report** — plaintext Markdown with trace-oriented calculation and evidence sections;
- **Client report** — standalone plaintext HTML with a compact client-facing summary and epistemic boundary.

Reports do not contain every Case Vault field and are not backups.

## Abjad Laboratory

The visible calculator uses the standard `ABJAD_KABIR` table and the current default normalization:

- Unicode NFC normalization;
- Arabic combining marks and Qur’anic annotation marks removed;
- tatweel removed;
- `أ`, `إ`, `آ`, and `ٱ` unified to `ا`;
- `ى` and `ئ` unified to `ي`;
- `ؤ` unified to `و`;
- non-Arabic/unsupported characters removed.

The screen shows original text, normalized text, a per-letter ledger, the Kabir total, and repeated decimal digit reductions. The core API also supports custom normalization and modulo analysis for 4, 7, 9, 12, 16, and 28 by default.

Current default behavior deliberately does **not** convert `ة` to `ه`; a retained `ة` therefore contributes zero in the current mapping. Programmatic callers that intend `ة` to count as `ه` must set `taMarbutaAsHa: true` and record that methodology choice. Spelling and normalization choices can change the total, so preserve the original and normalized forms when citing a result.

## Celestial Intelligence

Enter latitude, longitude, and a moment. The visible `datetime-local` value is interpreted in the browser’s local time zone; it has no embedded IANA time-zone identifier. Record the intended zone separately when reproducibility across devices matters.

The current implementation uses:

- SunCalc sunrise, sunset, next sunrise, and lunar illumination;
- unequal planetary hours: daylight and night are each divided into 12 intervals;
- weekday rulers and the Chaldean planetary sequence;
- Astronomy Engine for geocentric classical-body positions in the core API;
- an explicitly named `equal-arc-28` lunar-mansion index, dividing longitude into 28 equal arcs.

At polar or otherwise unsupported date/location combinations, valid rise/set boundaries may not exist; the interface reports celestial context as unavailable. Solar fixtures are independently compared with USNO tables within a documented ±6-minute tolerance. Independent JPL numerical fixtures for Moon ecliptic longitude and the derived mansion remain data-blocked; see [Astronomy validation](ASTRONOMY_VALIDATION.md). Do not describe the lunar mansion output as independently validated until that blocker is closed.

## Case Vault: live SQLite persistence

Case Vault opens a real SQLite database using `sql.js`. The database lives in memory while open and is serialized to IndexedDB after writes. The default IndexedDB location is:

- database: `allama-absolute`;
- object store: `files`;
- key: `main.sqlite`.

Browser storage is isolated by origin. `localhost:4173`, `127.0.0.1:4173`, another port, another browser profile, and another device do not share the same database.

### Cases and casts

Create a case from a question, select it, then save the current cast. A second or later cast for the same case requires a written recast reason. The new cast links to the prior cast instead of overwriting it, and the case timeline records the event.

**Continue case** restores the saved question and most recent Mother IDs to the analysis workspace. It does not silently restore every historical UI input such as coordinates.

### Notes, predictions, outcomes, and overrides

- Practitioner notes are stored with the case and are marked private in the database model. “Private” is metadata; the local database itself is not encrypted at rest.
- **Capture current prediction** freezes the current traditional verdict, evidence, methodology version, time, and the latest cast link if one exists.
- Record a resolved YES/NO outcome only when the event is genuinely resolved. Outcome notes should name the evidence used to determine resolution.
- A practitioner override requires a captured prediction and a written reason. The machine verdict remains preserved beside the override.
- Calibration recomputation uses only cases with a latest binary YES/NO prediction and a latest resolved binary outcome. MIXED and UNKNOWN predictions are not scored.

Similar-case percentages are lexical similarity scores over stored case questions. They are not historical success probabilities.

### Health panel

The health panel shows SQLite `PRAGMA integrity_check`, schema `user_version`, table count, and selected record counts. The current schema version is 4. An `ok` integrity result means SQLite accepted the database structure; it does not prove semantic correctness, authenticity, or absence of malicious content.

## Export, backup, restore, and import

| Action | Contents | Protection | Can the UI import it? |
| --- | --- | --- | --- |
| Export case JSON | Selected case, casts, notes, predictions, outcomes, overrides | Plaintext | No case-JSON importer currently |
| Export SQLite database | Entire live SQLite file, including cases and settings/reference tables | Plaintext | Yes, in Case Vault |
| Export encrypted profile | Methodology profile only | PBKDF2-SHA256 + AES-256-GCM | Yes, in Settings |
| Scholar/client/shield export | Current report or shield | Plaintext | No |

Before importing a `.sqlite` or `.db` file:

1. export the current database and store the backup safely;
2. confirm you selected the intended file;
3. remember that import replaces the active database rather than merging it.

The importer opens the file as SQLite, runs `PRAGMA integrity_check`, applies current schema/migrations, reseeds reference data, runs a post-migration integrity check, and only then persists it. If validation or migration fails, the open repository rolls back to the prior in-memory database. Integrity checking is not malware scanning or provenance verification.

The encrypted methodology export does not include cases, casts, notes, outcomes, experiments, or the full database. Losing its password means the application cannot decrypt it; no recovery mechanism is implemented.

## Research Laboratory

The Research Laboratory enforces “no data, no performance claim.” It can calculate:

- sample size, accuracy, and Wilson interval from stored scorable outcomes;
- confidence bins, category performance, historical accuracy, and figure frequencies;
- error autopsies without rewriting historical predictions;
- blind “Don’t Tell Absolute” sessions with SHA-256 integrity locks;
- user-supplied subsystem ablation data, method tournaments, human-vs-system comparisons, and rule-survival summaries;
- ranked remote-state hypotheses from explicit user-supplied rule votes.

A blind lock demonstrates that the same serialized prediction payload has not changed since the lock time stored inside the record. It is not an external timestamp, notarization, proof of authorship, or proof that information was unavailable to every participant.

Remote-state output is ranked symbolic hypothesis scoring. It is not direct perception, GPS data, verified observation, mind reading, or proof about a hidden person or place.

## Settings, methodology, and local AI

Settings stores the MUSA ALLAMA METHOD profile and protocol bookmarks in the same IndexedDB-backed SQLite database. JSON fields must contain valid arrays/objects of the described type; invalid JSON is rejected and shown as an error.

The local-AI panel accepts only loopback URLs using `localhost`, `127.0.0.1`, or `[::1]`. Presets are provided for:

- Ollama: `http://127.0.0.1:11434/v1`;
- LM Studio: `http://127.0.0.1:1234/v1`.

Enter the exact model name exposed by the local server, ensure its OpenAI-compatible `/chat/completions` route and browser CORS policy are enabled, then run **Test local model**. The endpoint, model name, and response in this panel are component state only and are not persisted by the current UI. No API key field is present in the local-AI settings panel.

The reusable `OpenAiCompatibleProvider` API can accept a remote endpoint and bearer key programmatically, but the current local UI does not expose that remote-provider setup. Never embed provider credentials in source, reports, or browser bundles.

## English, Arabic, and RTL

Use the sidebar language buttons to switch between English/LTR and Arabic/RTL. The application sets both the document `lang` and `dir` attributes, moves the navigation rail, mirrors inline border treatments, and right-aligns tables and controls where appropriate. Arabic labels are provided across the main practitioner surfaces, Case Vault, Research Lab, Timing, Graphs, and Settings.

Generated reports receive the selected language and direction. Some domain names, figure Latin names, analytical rationales, and technical/error strings remain English because they originate in the shared core datasets. Treat the interface as bilingual with known mixed-language core output, not as proof that every string has a complete human-reviewed translation.

## Command bar

The global command bar supports:

- `/cast`
- `/judge`
- `/reverse`
- `/house N` where `N` is 1–12
- `/abjad TEXT`
- `/hour`
- `/moon`
- `/deep`
- `/compare`
- `/lock`
- `/outcome`
- `/graphs`
- `/settings`

Commands navigate or set the visible tool. Case-dependent actions still require explicit interaction in Case Vault or Research Laboratory.

## Troubleshooting

### SQLite stays on “Opening” or data does not persist

- Confirm IndexedDB and WebAssembly are allowed for the current origin.
- Do not use a private/incognito session for data you expect to retain.
- Check browser developer-console errors and available site-storage quota.
- Reopen the same scheme, hostname, and port used previously.
- If integrity fails after an import, return to a known-good exported `.sqlite` file.

### A previous database appears empty

Storage is origin-scoped. Switching between `localhost` and `127.0.0.1`, changing ports, clearing site data, or using another profile creates a different storage context. Return to the original origin or import your exported database.

### Local AI fails

- Start the local server and load the named model first.
- Include `/v1` in the endpoint expected by the presets; the application appends `/chat/completions`.
- Confirm the endpoint is loopback, uses a supported URL form, and allows requests from the app’s browser origin.
- Browser HTTPS pages may block an HTTP loopback endpoint as mixed content, depending on browser policy.
- Local AI is optional; deterministic analysis and storage continue without it.

### Planetary hour is unavailable or looks shifted

- Check latitude/longitude signs and the browser/device time zone.
- Remember that `datetime-local` is interpreted in that local zone.
- Rise/set can be unavailable at extreme latitudes or dates.
- Compare UTC instants, not formatted wall-clock strings, when reproducing results on another device.

### Encrypted methodology restore fails

- Confirm the selected JSON is an encrypted methodology export, not a case JSON export.
- Enter the exact password; AES-GCM authentication intentionally rejects a wrong password or modified ciphertext.
- There is no password reset or recovery path.

### The production app shows stale assets

The production service worker uses a network-first cache and may retain successful GET responses. Reload after a new deployment; if necessary, unregister the service worker and clear this site’s cache. Export the SQLite database before clearing all site data, because clearing site data can also remove IndexedDB.

## Safety and research boundaries

Do not use symbolic output as diagnosis, adjudication, guaranteed financial guidance, emergency guidance, or verified accusation. Do not present internal confidence, council agreement, deep-search strength, similar-case similarity, or traditional timing rank as a calibrated real-world probability unless an actual held-out empirical study justifies that claim. Preserve sources, inputs, methodology versions, predictions, contrary evidence, and outcomes so another researcher can reproduce what the software calculated.
