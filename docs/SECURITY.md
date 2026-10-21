# Security and Privacy Model

## Local data and its limits

The deterministic analysis runs in the browser without an AI service or application backend. The live case repository is a `sql.js` SQLite database serialized into origin-scoped IndexedDB. It is **not encrypted at rest**: anyone with access to the browser profile or an unlocked device may be able to read it. Browser site-data clearing can erase the only local copy, so export a backup before clearing data or changing devices.

Raw SQLite database exports, case JSON exports and generated reports are plaintext. Treat them as sensitive files, control where they are saved and shared, and delete unwanted copies using the operating system's facilities. Importing a database validates its integrity and replaces the active browser database; export the current database first.

## Encrypted methodology backup

`src/core/security.ts` provides PBKDF2-HMAC-SHA-256 (250,000 iterations, random 16-byte salt) and AES-256-GCM (random 12-byte IV). The Settings workflow uses this to encrypt a **methodology profile**, not the entire SQLite database or case history. Its envelope contains `version`, `algorithm`, `kdf`, `iterations`, `salt`, `iv` and `ciphertext`. The methodology kind and profile are inside the encrypted payload.

A strong passphrase is necessary; there is no passphrase-recovery service. AES-GCM detects tampering with that payload, but encryption does not protect an unlocked browser session, plaintext exports or the device itself.

## Optional AI and network use

Core calculations do not require AI. The UI's optional local AI presets target loopback endpoints (Ollama or LM Studio). The provider interface in `src/core/ai.ts` can also be configured programmatically for an OpenAI-compatible endpoint, which sends the supplied analysis and any configured credential to that endpoint. Do not embed remote API keys in shipped browser code or commit them; use an appropriate protected backend if a remote service needs a secret. Review an endpoint's privacy policy before sending sensitive case text.

## Integrity controls

Blind-trial prediction locks are SHA-256 hashes over a trial payload and creation timestamp. Verification recomputes the hash before reveal/scoring. A hash is an integrity check, **not encryption**; it does not hide a predictable payload. A recast requires a reason and preserves the earlier cast. Methodology versions and prediction snapshots should remain historical records rather than being rewritten after an outcome is known.

The database performs SQLite integrity and foreign-key checks. These checks detect structural problems; they do not establish that an interpretation, source, or entered outcome is true.
