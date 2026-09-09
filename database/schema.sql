PRAGMA foreign_keys = ON;

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
  status TEXT NOT NULL DEFAULT 'open',
  blind_mode INTEGER NOT NULL DEFAULT 0
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

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cast_id TEXT REFERENCES casts(id),
  methodology_version TEXT NOT NULL,
  verdict_json TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  date_text TEXT,
  locator TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES sources(id),
  body_md TEXT NOT NULL,
  private INTEGER NOT NULL DEFAULT 1,
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
