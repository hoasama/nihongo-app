import type { Queryable } from "./queryable";
import type { Sense, Sentence, WordDetail, WordSummary } from "../shared/types";

/** Bỏ ký tự đặc biệt cú pháp FTS5, giữ chữ/số/kana/kanji. */
function sanitizeFts(s: string): string {
  return s
    .replace(/["*()^:{}\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchWords(
  db: Queryable,
  query: string,
  level?: string,
): Promise<WordSummary[]> {
  const cleaned = sanitizeFts(query);
  if (!cleaned) return [];
  const match = cleaned
    .split(" ")
    .map((t) => `${t}*`)
    .join(" ");
  const params: unknown[] = [match];
  let sql = `
    SELECT w.id, w.headword, w.reading_kana, w.jlpt_level, w.is_common
    FROM words_fts
    JOIN words w ON w.id = words_fts.word_id
    WHERE words_fts MATCH ?`;
  if (level) {
    sql += " AND w.jlpt_level = ?";
    params.push(level);
  }
  // Ưu tiên: thông dụng → tần suất cao (nf nhỏ, null xuống cuối) → từ ngắn.
  sql +=
    " ORDER BY w.is_common DESC, w.freq_rank IS NULL, w.freq_rank ASC, length(w.headword) ASC LIMIT 50";
  return db.select<WordSummary>(sql, params);
}

export async function getWordDetail(
  db: Queryable,
  id: number,
): Promise<WordDetail | null> {
  const rows = await db.select<WordSummary & { reading_romaji: string | null }>(
    `SELECT id, headword, reading_kana, reading_romaji, jlpt_level, is_common
     FROM words WHERE id = ?`,
    [id],
  );
  const w = rows[0];
  if (!w) return null;
  const senses = await db.select<Sense>(
    `SELECT part_of_speech, gloss_en, gloss_vi FROM senses
     WHERE word_id = ? ORDER BY order_idx`,
    [id],
  );
  const sentences = await db.select<Sentence>(
    `SELECT s.id, s.jp_text, s.translation_en
     FROM sentences s JOIN sentence_words sw ON sw.sentence_id = s.id
     WHERE sw.word_id = ? LIMIT 5`,
    [id],
  );
  return { ...w, senses, sentences };
}
