-- Member WP v0.12 — Cloudflare D1
-- The Pages Function also runs CREATE TABLE IF NOT EXISTS automatically.

CREATE TABLE IF NOT EXISTS member_wp_records (
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection, record_id)
);

CREATE INDEX IF NOT EXISTS idx_member_wp_records_collection
ON member_wp_records(collection);
