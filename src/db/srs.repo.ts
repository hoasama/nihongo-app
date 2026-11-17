import type { Queryable } from "./queryable";
import type { Deck, DeckCategory } from "../shared/types";

const PRESET_DECKS: Omit<Deck, "id">[] = [
  { name: "N5 Từ vựng", category: "vocab", kind: "jlpt_vocab", level: "N5" },
  { name: "N4 Từ vựng", category: "vocab", kind: "jlpt_vocab", level: "N4" },
  { name: "Từ vựng đã lưu", category: "vocab", kind: "bookmarks_vocab", level: null },
  { name: "N5 Kanji", category: "kanji", kind: "jlpt_kanji", level: "N5" },
  { name: "N4 Kanji", category: "kanji", kind: "jlpt_kanji", level: "N4" },
  { name: "Kanji đã lưu", category: "kanji", kind: "bookmarks_kanji", level: null },
];

/** Tạo 6 deck preset nếu bảng decks còn rỗng (idempotent). */
export async function ensurePresetDecks(db: Queryable): Promise<void> {
  const rows = await db.select<{ n: number }>("SELECT COUNT(*) AS n FROM decks");
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const d of PRESET_DECKS) {
    await db.execute(
      "INSERT INTO decks (name, category, kind, level) VALUES (?,?,?,?)",
      [d.name, d.category, d.kind, d.level],
    );
  }
}

export async function listDecks(
  db: Queryable,
  category: DeckCategory,
): Promise<Deck[]> {
  return db.select<Deck>(
    "SELECT id, name, category, kind, level FROM decks WHERE category = ? ORDER BY id",
    [category],
  );
}
