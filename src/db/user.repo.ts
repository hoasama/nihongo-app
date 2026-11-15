import type { Queryable } from "./queryable";
import type { Bookmark, ItemType } from "../shared/types";

export async function isBookmarked(
  db: Queryable,
  type: ItemType,
  itemId: number,
): Promise<boolean> {
  const r = await db.select<{ n: number }>(
    "SELECT COUNT(*) AS n FROM bookmarks WHERE item_type = ? AND item_id = ?",
    [type, itemId],
  );
  return (r[0]?.n ?? 0) > 0;
}

export async function addBookmark(
  db: Queryable,
  type: ItemType,
  itemId: number,
): Promise<void> {
  await db.execute(
    "INSERT OR IGNORE INTO bookmarks (item_type, item_id) VALUES (?, ?)",
    [type, itemId],
  );
}

export async function removeBookmark(
  db: Queryable,
  type: ItemType,
  itemId: number,
): Promise<void> {
  await db.execute(
    "DELETE FROM bookmarks WHERE item_type = ? AND item_id = ?",
    [type, itemId],
  );
}

export async function listBookmarks(db: Queryable): Promise<Bookmark[]> {
  return db.select<Bookmark>(
    "SELECT id, item_type, item_id, created_at FROM bookmarks ORDER BY created_at DESC, id DESC",
  );
}

export async function getNote(
  db: Queryable,
  type: ItemType,
  itemId: number,
): Promise<string | null> {
  const r = await db.select<{ body: string }>(
    "SELECT body FROM notes WHERE item_type = ? AND item_id = ?",
    [type, itemId],
  );
  return r[0]?.body ?? null;
}

export async function saveNote(
  db: Queryable,
  type: ItemType,
  itemId: number,
  body: string,
): Promise<void> {
  if (!body.trim()) {
    await db.execute(
      "DELETE FROM notes WHERE item_type = ? AND item_id = ?",
      [type, itemId],
    );
    return;
  }
  await db.execute(
    `INSERT INTO notes (item_type, item_id, body, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(item_type, item_id)
     DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    [type, itemId, body],
  );
}

export async function getSetting(
  db: Queryable,
  key: string,
): Promise<string | null> {
  const r = await db.select<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return r[0]?.value ?? null;
}

export async function setSetting(
  db: Queryable,
  key: string,
  value: string,
): Promise<void> {
  await db.execute(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
