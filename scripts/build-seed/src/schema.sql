-- Lược đồ seed.sqlite (dữ liệu reference, read-only trong app).
-- Sinh bởi scripts/build-seed/src/buildSeed.ts

PRAGMA journal_mode = WAL;

-- Từ vựng (JMdict)
CREATE TABLE words (
  id            INTEGER PRIMARY KEY,
  headword      TEXT NOT NULL,          -- dạng kanji (hoặc kana nếu không có kanji)
  reading_kana  TEXT NOT NULL,          -- cách đọc kana
  reading_romaji TEXT,                  -- romaji hoá (để tìm bằng romaji)
  jlpt_level    TEXT,                   -- 'N5' | 'N4' | NULL
  is_common     INTEGER NOT NULL DEFAULT 0,
  freq_rank     INTEGER
);

-- Nghĩa của từ (một từ nhiều nghĩa theo loại từ)
CREATE TABLE senses (
  id            INTEGER PRIMARY KEY,
  word_id       INTEGER NOT NULL REFERENCES words(id),
  part_of_speech TEXT,
  gloss_en      TEXT,
  gloss_vi      TEXT,                   -- chỉ có cho tập N5/N4, còn lại NULL
  order_idx     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_senses_word ON senses(word_id);

-- Kanji (KANJIDIC2)
CREATE TABLE kanji (
  id            INTEGER PRIMARY KEY,
  literal       TEXT NOT NULL UNIQUE,
  grade         INTEGER,
  jlpt_level    TEXT,
  stroke_count  INTEGER,
  radical       TEXT,
  on_readings   TEXT,                   -- phân tách bằng '、'
  kun_readings  TEXT,
  meaning_en    TEXT,
  meaning_vi    TEXT,
  freq_rank     INTEGER
);
CREATE INDEX idx_kanji_level ON kanji(jlpt_level);

-- Liên kết kanji ↔ từ chứa kanji đó
CREATE TABLE kanji_words (
  kanji_id      INTEGER NOT NULL REFERENCES kanji(id),
  word_id       INTEGER NOT NULL REFERENCES words(id),
  PRIMARY KEY (kanji_id, word_id)
);

-- Câu ví dụ (Tatoeba)
CREATE TABLE sentences (
  id            INTEGER PRIMARY KEY,
  jp_text       TEXT NOT NULL,
  translation_en TEXT,
  source        TEXT
);

-- Câu ví dụ gắn với từ (Pha 1 có thể rỗng)
CREATE TABLE sentence_words (
  sentence_id   INTEGER NOT NULL REFERENCES sentences(id),
  word_id       INTEGER NOT NULL REFERENCES words(id),
  PRIMARY KEY (sentence_id, word_id)
);

-- Ngữ pháp N5/N4 (biên soạn)
CREATE TABLE grammar (
  id            INTEGER PRIMARY KEY,
  title         TEXT NOT NULL,
  jlpt_level    TEXT NOT NULL,
  structure     TEXT,
  meaning_vi    TEXT,
  explanation_vi TEXT,
  examples_json TEXT                    -- JSON: [{ "jp": "...", "vi": "..." }]
);
CREATE INDEX idx_grammar_level ON grammar(jlpt_level);

-- FTS5 để tìm kiếm từ nhanh (external content = bảng words/senses gộp khi insert)
CREATE VIRTUAL TABLE words_fts USING fts5(
  headword,
  reading_kana,
  reading_romaji,
  gloss_en,
  gloss_vi,
  word_id UNINDEXED
);
