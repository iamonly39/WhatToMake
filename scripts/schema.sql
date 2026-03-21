CREATE TABLE IF NOT EXISTS meals (
  id          SERIAL PRIMARY KEY,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT 'other',
  notes       TEXT,
  source_url  TEXT,
  created_at  DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS meal_history (
  id        SERIAL PRIMARY KEY,
  meal_id   INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  made_on   DATE    NOT NULL,
  rating    INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes     TEXT
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id       SERIAL PRIMARY KEY,
  week_of  DATE NOT NULL UNIQUE,
  meal_ids INTEGER[] NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value)
VALUES ('dietary_notes', 'Low salt. No shellfish. Not spicy. Not crunchy.')
ON CONFLICT (key) DO NOTHING;
