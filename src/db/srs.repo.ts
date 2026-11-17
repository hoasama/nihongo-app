import type { Queryable } from "./queryable";
import type { Deck, DeckCategory, Card, CardDirection } from "../shared/types";

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

const DIRECTIONS: CardDirection[] = ["recognition", "production"];

async function getDeck(db: Queryable, deckId: number): Promise<Deck | undefined> {
  const r = await db.select<Deck>(
    "SELECT id, name, category, kind, level FROM decks WHERE id = ?",
    [deckId],
  );
  return r[0];
}

function itemTypeOf(deck: Deck): "word" | "kanji" {
  return deck.category === "vocab" ? "word" : "kanji";
}

/** item_id của vùng chứa deck (từ seed hoặc bookmarks). */
async function poolItemIds(db: Queryable, deck: Deck): Promise<number[]> {
  let rows: { id: number }[];
  switch (deck.kind) {
    case "jlpt_vocab":
      rows = await db.select<{ id: number }>(
        "SELECT id FROM words WHERE jlpt_level = ? ORDER BY is_common DESC, freq_rank IS NULL, freq_rank ASC, id",
        [deck.level],
      );
      break;
    case "jlpt_kanji":
      rows = await db.select<{ id: number }>(
        "SELECT id FROM kanji WHERE jlpt_level = ? ORDER BY stroke_count, id",
        [deck.level],
      );
      break;
    case "bookmarks_vocab":
      rows = await db.select<{ id: number }>(
        "SELECT item_id AS id FROM bookmarks WHERE item_type = 'word' ORDER BY id",
      );
      break;
    case "bookmarks_kanji":
      rows = await db.select<{ id: number }>(
        "SELECT item_id AS id FROM bookmarks WHERE item_type = 'kanji' ORDER BY id",
      );
      break;
    default:
      rows = [];
  }
  return rows.map((r) => r.id);
}

async function cardedItemIds(db: Queryable, deckId: number): Promise<Set<number>> {
  const rows = await db.select<{ item_id: number }>(
    "SELECT DISTINCT item_id FROM cards WHERE deck_id = ?",
    [deckId],
  );
  return new Set(rows.map((r) => r.item_id));
}

/** Giới thiệu tối đa `n` mục mới (chưa có thẻ) → tạo 2 thẻ/mục. Trả thẻ vừa tạo. */
export async function introduceNewCards(
  db: Queryable,
  deckId: number,
  n: number,
): Promise<Card[]> {
  if (n <= 0) return [];
  const deck = await getDeck(db, deckId);
  if (!deck) return [];
  const itemType = itemTypeOf(deck);
  const pool = await poolItemIds(db, deck);
  const carded = await cardedItemIds(db, deckId);
  const fresh = pool.filter((id) => !carded.has(id)).slice(0, n);
  const nowIso = new Date().toISOString();
  const created: Card[] = [];
  for (const itemId of fresh) {
    for (const direction of DIRECTIONS) {
      const res = await db.execute(
        `INSERT OR IGNORE INTO cards (deck_id, item_type, item_id, direction, due)
         VALUES (?,?,?,?,?)`,
        [deckId, itemType, itemId, direction, nowIso],
      );
      if (res.changes > 0) {
        created.push({
          id: res.lastInsertRowid,
          deck_id: deckId,
          item_type: itemType,
          item_id: itemId,
          direction,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          lapses: 0,
          due: nowIso,
        });
      }
    }
  }
  return created;
}

/** Số thẻ đến hạn + số mục mới còn được giới thiệu hôm nay (theo newPerDay). */
export async function getDeckCounts(
  db: Queryable,
  deckId: number,
  newPerDay: number,
): Promise<{ due: number; newRemaining: number }> {
  const nowIso = new Date().toISOString();
  const dueRow = await db.select<{ n: number }>(
    "SELECT COUNT(*) AS n FROM cards WHERE deck_id = ? AND due <= ?",
    [deckId, nowIso],
  );
  const deck = await getDeck(db, deckId);
  if (!deck) return { due: dueRow[0]?.n ?? 0, newRemaining: 0 };

  const pool = await poolItemIds(db, deck);
  const carded = await cardedItemIds(db, deckId);
  const poolRemaining = pool.filter((id) => !carded.has(id)).length;

  const introRow = await db.select<{ n: number }>(
    `SELECT COUNT(DISTINCT item_id) AS n FROM cards
     WHERE deck_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')`,
    [deckId],
  );
  const introducedToday = introRow[0]?.n ?? 0;
  const newRemaining = Math.max(
    0,
    Math.min(poolRemaining, newPerDay - introducedToday),
  );
  return { due: dueRow[0]?.n ?? 0, newRemaining };
}
