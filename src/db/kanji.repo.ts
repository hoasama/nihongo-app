import type { Queryable } from "./queryable";
import type { KanjiDetail, KanjiSummary, WordSummary } from "../shared/types";

const SUMMARY_COLS =
  "id, literal, meaning_en, jlpt_level, stroke_count";

export async function searchKanji(
  db: Queryable,
  query: string,
): Promise<KanjiSummary[]> {
  const q = query.trim();
  if (!q) return [];
  return db.select<KanjiSummary>(
    `SELECT ${SUMMARY_COLS} FROM kanji
     WHERE literal = ? OR meaning_en LIKE ?
     ORDER BY stroke_count LIMIT 50`,
    [q, `%${q}%`],
  );
}

export async function listByLevel(
  db: Queryable,
  level: string,
): Promise<KanjiSummary[]> {
  return db.select<KanjiSummary>(
    `SELECT ${SUMMARY_COLS} FROM kanji
     WHERE jlpt_level = ? ORDER BY stroke_count, literal`,
    [level],
  );
}

export async function getKanjiDetail(
  db: Queryable,
  id: number,
): Promise<KanjiDetail | null> {
  const rows = await db.select<Omit<KanjiDetail, "words">>(
    `SELECT id, literal, meaning_en, meaning_vi, jlpt_level, grade,
            stroke_count, radical, on_readings, kun_readings
     FROM kanji WHERE id = ?`,
    [id],
  );
  const k = rows[0];
  if (!k) return null;
  const words = await db.select<WordSummary>(
    `SELECT w.id, w.headword, w.reading_kana, w.jlpt_level, w.is_common
     FROM words w JOIN kanji_words kw ON kw.word_id = w.id
     WHERE kw.kanji_id = ? LIMIT 30`,
    [id],
  );
  return { ...k, words };
}
