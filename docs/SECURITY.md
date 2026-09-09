# Security Model

## Local-first

The deterministic core runs in the browser without requiring a remote AI provider. Networked AI is opt-in through explicit provider configuration.

## Secrets

API keys must never be committed to the repository or embedded in reports. Provider credentials belong in runtime configuration.

## Encrypted backups

The backup encryption primitive uses:

- PBKDF2 with SHA-256;
- 250,000 iterations;
- random 16-byte salt;
- AES-256-GCM;
- random 12-byte IV.

A backup envelope carries format and methodology version metadata. Encryption protects confidentiality and authenticity of the encrypted payload but does not replace device security.

## Blind trials

Prediction locks use SHA-256 over the canonical trial payload and creation timestamp. Reveal verification recomputes the lock before scoring.

## Historical integrity

Recasts require a reason. Methodology versions and prior predictions should be retained rather than rewritten after outcomes become known.

## Browser storage

The current browser case repository uses local storage as an operational shell. The repository also includes the normalized SQLite schema required for the desktop-grade persistent database. The completion audit therefore marks the database section partial until SQLite is wired as the live persistence layer.
