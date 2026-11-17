-- Bảng dữ liệu người dùng (writable) — nằm trong user.sqlite (DB main).
-- Dùng chung bởi Electron main (electron/main.cjs) và test (makeTestDb).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_type, item_id)
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_type, item_id)
);

-- SRS: bộ thẻ, thẻ, lượt ôn (Pha 2). Thẻ tham chiếu seed (item_type,item_id).
CREATE TABLE IF NOT EXISTS decks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,          -- 'vocab' | 'kanji'
  kind        TEXT NOT NULL,          -- 'jlpt_vocab'|'jlpt_kanji'|'bookmarks_vocab'|'bookmarks_kanji'
  level       TEXT,                   -- 'N5' | 'N4' | NULL
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id       INTEGER NOT NULL REFERENCES decks(id),
  item_type     TEXT NOT NULL,        -- 'word' | 'kanji'
  item_id       INTEGER NOT NULL,
  direction     TEXT NOT NULL,        -- 'recognition' | 'production'
  ease_factor   REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  due           TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (deck_id, item_type, item_id, direction)
);
CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(deck_id, due);
CREATE TABLE IF NOT EXISTS reviews (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id        INTEGER NOT NULL REFERENCES cards(id),
  rating         TEXT NOT NULL,
  reviewed_at    TEXT NOT NULL DEFAULT (datetime('now')),
  interval_after REAL NOT NULL
);
