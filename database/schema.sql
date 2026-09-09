PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  question_original TEXT NOT NULL,
  question_normalized TEXT,
  domain TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  blind_mode INTEGER NOT NULL DEFAULT 0,
  timeline_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS casts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  entropy_method TEXT,
  mothers_json TEXT NOT NULL,
  shield_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  supersedes_cast_id TEXT REFERENCES casts(id),
  recast_reason TEXT
);

CREATE TABLE IF NOT EXISTS figures (
  id TEXT PRIMARY KEY,
  latin_name TEXT NOT NULL,
  arabic_name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  element TEXT,
  planet TEXT,
  quality TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 12),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS correspondence_tables (
  id TEXT PRIMARY KEY,
  family TEXT NOT NULL,
  key_text TEXT NOT NULL,
  value_json TEXT NOT NULL,
  provenance_source_id TEXT REFERENCES sources(id),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS abjad_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  mapping_json TEXT NOT NULL,
  normalization_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cast_id TEXT REFERENCES casts(id),
  methodology_version TEXT NOT NULL,
  verdict_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  lock_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  prediction_id TEXT REFERENCES predictions(id),
  outcome_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  expression_json TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  provenance_source_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS methodology_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  profile_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS protocol_bookmarks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  protocol_id TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  date_text TEXT,
  locator TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES sources(id),
  title TEXT NOT NULL,
  mime_type TEXT,
  checksum TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES sources(id),
  body_md TEXT NOT NULL,
  private INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS practitioner_notes (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  private INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS practitioner_overrides (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  prediction_id TEXT REFERENCES predictions(id),
  practitioner TEXT NOT NULL,
  machine_verdict_json TEXT NOT NULL,
  override_decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS celestial_data (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  timestamp_utc TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS experiment_trials (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  case_id TEXT REFERENCES cases(id),
  prediction_lock_hash TEXT,
  prediction_json TEXT,
  reveal_json TEXT,
  score_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calibration (
  id TEXT PRIMARY KEY,
  methodology_version TEXT NOT NULL,
  scope TEXT NOT NULL,
  metric TEXT NOT NULL,
  sample_size INTEGER NOT NULL,
  value REAL NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at);
CREATE INDEX IF NOT EXISTS idx_casts_case_id ON casts(case_id);
CREATE INDEX IF NOT EXISTS idx_predictions_case_id ON predictions(case_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_case_id ON outcomes(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_case_id ON practitioner_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_overrides_case_id ON practitioner_overrides(case_id);
CREATE INDEX IF NOT EXISTS idx_calibration_scope ON calibration(scope,metric);

INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(3,datetime('now'));
PRAGMA user_version = 3;
