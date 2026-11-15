// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  listBookmarks,
  listBookmarksDetailed,
  getNote,
  saveNote,
  getSetting,
  setSetting,
} from "../user.repo";

describe("user.repo", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
  });

  it("bookmark: thêm / kiểm tra / liệt kê / xoá", async () => {
    expect(await isBookmarked(t.q, "word", 1)).toBe(false);
    await addBookmark(t.q, "word", 1);
    await addBookmark(t.q, "word", 1); // idempotent
    expect(await isBookmarked(t.q, "word", 1)).toBe(true);
    expect(await listBookmarks(t.q)).toHaveLength(1);
    await removeBookmark(t.q, "word", 1);
    expect(await isBookmarked(t.q, "word", 1)).toBe(false);
  });

  it("note: lưu / đọc / xoá khi rỗng", async () => {
    expect(await getNote(t.q, "kanji", 5)).toBeNull();
    await saveNote(t.q, "kanji", 5, "ghi chú");
    expect(await getNote(t.q, "kanji", 5)).toBe("ghi chú");
    await saveNote(t.q, "kanji", 5, "sửa lại");
    expect(await getNote(t.q, "kanji", 5)).toBe("sửa lại");
    await saveNote(t.q, "kanji", 5, "   ");
    expect(await getNote(t.q, "kanji", 5)).toBeNull();
  });

  it("listBookmarksDetailed trả nhãn từ seed", async () => {
    t.raw.exec(
      `INSERT INTO words (id, headword, reading_kana, reading_romaji, is_common) VALUES (1,'水','みず','mizu',1)`,
    );
    await addBookmark(t.q, "word", 1);
    const list = await listBookmarksDetailed(t.q);
    expect(list[0].label).toBe("水");
    expect(list[0].item_type).toBe("word");
  });

  it("setting: get null → set → get", async () => {
    expect(await getSetting(t.q, "theme")).toBeNull();
    await setSetting(t.q, "theme", "dark");
    expect(await getSetting(t.q, "theme")).toBe("dark");
    await setSetting(t.q, "theme", "light");
    expect(await getSetting(t.q, "theme")).toBe("light");
  });
});
