import type { Queryable } from "./queryable";
import type { Sense, Sentence, WordDetail, WordSummary } from "../shared/types";
import { POS_LIKE, type WordType } from "../shared/pos";

/** Điều kiện EXISTS lọc theo loại từ (khớp mã JMdict trong senses.part_of_speech). */
function posExists(type: WordType | undefined, params: unknown[]): string {
  if (!type || type === "all") return "";
  const pats = POS_LIKE[type];
  params.push(...pats);
  return `EXISTS (SELECT 1 FROM senses s WHERE s.word_id = w.id AND (${pats
    .map(() => "s.part_of_speech LIKE ?")
    .join(" OR ")}))`;
}

/** Bỏ ký tự đặc biệt cú pháp FTS5, giữ chữ/số/kana/kanji. */
function sanitizeFts(s: string): string {
  return s
    .normalize("NFC") // seed lưu NFC; một số bộ gõ gửi dấu tách rời (NFD)
    .replace(/["*()^:{}\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchWords(
  db: Queryable,
  query: string,
  level?: string,
  type?: WordType,
): Promise<WordSummary[]> {
  const cleaned = sanitizeFts(query);
  if (!cleaned) return [];
  const match = cleaned
    .split(" ")
    .map((t) => `${t}*`)
    .join(" ");
  const params: unknown[] = [match];
  let sql = `
    SELECT w.id, w.headword, w.reading_kana, w.jlpt_level, w.is_common,
      COALESCE(
        (SELECT gloss_vi FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1),
        (SELECT gloss_en FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1)
      ) AS gloss
    FROM words_fts
    JOIN words w ON w.id = words_fts.word_id
    WHERE words_fts MATCH ?`;
  if (level) {
    sql += " AND w.jlpt_level = ?";
    params.push(level);
  }
  const ex = posExists(type, params);
  if (ex) sql += " AND " + ex;
  // Ưu tiên: thông dụng → tần suất cao (nf nhỏ, null xuống cuối) → từ ngắn.
  sql +=
    " ORDER BY w.is_common DESC, w.freq_rank IS NULL, w.freq_rank ASC, length(w.headword) ASC LIMIT 50";
  return db.select<WordSummary>(sql, params);
}

/** Duyệt từ theo cấp (không cần từ khoá) để làm danh sách chọn ở cột trái. */
export async function listWords(
  db: Queryable,
  level?: string,
  type?: WordType,
  limit = 300,
): Promise<WordSummary[]> {
  const params: unknown[] = [];
  const conds: string[] = [];
  if (level) {
    conds.push("w.jlpt_level = ?");
    params.push(level);
  }
  const ex = posExists(type, params);
  if (ex) conds.push(ex);
  let sql = `
    SELECT w.id, w.headword, w.reading_kana, w.jlpt_level, w.is_common,
      COALESCE(
        (SELECT gloss_vi FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1),
        (SELECT gloss_en FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1)
      ) AS gloss
    FROM words w`;
  if (conds.length) sql += " WHERE " + conds.join(" AND ");
  sql +=
    " ORDER BY w.is_common DESC, w.freq_rank IS NULL, w.freq_rank ASC, length(w.headword) ASC LIMIT ?";
  params.push(limit);
  return db.select<WordSummary>(sql, params);
}

/** Các từ đã đánh dấu yêu thích (bookmark), mới nhất trước. */
export async function listBookmarkedWords(
  db: Queryable,
  type?: WordType,
): Promise<WordSummary[]> {
  const params: unknown[] = [];
  let sql = `SELECT w.id, w.headword, w.reading_kana, w.jlpt_level, w.is_common,
       COALESCE(
         (SELECT gloss_vi FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1),
         (SELECT gloss_en FROM senses WHERE word_id = w.id ORDER BY order_idx LIMIT 1)
       ) AS gloss
     FROM bookmarks b
     JOIN words w ON w.id = b.item_id
     WHERE b.item_type = 'word'`;
  const ex = posExists(type, params);
  if (ex) sql += " AND " + ex;
  sql += " ORDER BY b.created_at DESC, b.id DESC";
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
    `SELECT s.id, s.jp_text, s.furigana, s.translation_en
     FROM sentences s JOIN sentence_words sw ON sw.sentence_id = s.id
     WHERE sw.word_id = ? LIMIT 5`,
    [id],
  );
  return { ...w, senses, sentences };
}
