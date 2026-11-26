import type { Queryable } from "./queryable";
import type { KanjiDetail, KanjiSummary, WordSummary } from "../shared/types";

const SUMMARY_COLS =
  "id, literal, meaning_en, meaning_vi, han_viet, jlpt_level, stroke_count";

export async function searchKanji(
  db: Queryable,
  query: string,
): Promise<KanjiSummary[]> {
  const q = query.trim().normalize("NFC");
  if (!q) return [];
  // LIKE chỉ bỏ qua hoa/thường với ASCII: "đạo" không khớp "Đạo" → thử thêm dạng viết hoa chữ đầu.
  const cap = q[0].toLocaleUpperCase("vi") + q.slice(1);
  return db.select<KanjiSummary>(
    `SELECT ${SUMMARY_COLS} FROM kanji
     WHERE literal = ?1 OR meaning_en LIKE ?2 OR meaning_vi LIKE ?2
        OR han_viet LIKE ?2 OR han_viet LIKE ?3
     ORDER BY jlpt_level IS NULL, jlpt_level DESC, stroke_count LIMIT 50`,
    [q, `%${q}%`, `%${cap}%`],
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
    `SELECT id, literal, meaning_en, meaning_vi, han_viet, jlpt_level, grade,
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
