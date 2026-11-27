// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { searchKanji, listByLevel, getKanjiDetail } from "../kanji.repo";

function seed(t: TestDb) {
  t.raw.exec(`INSERT INTO kanji (id, literal, grade, jlpt_level, stroke_count, radical, on_readings, kun_readings, meaning_en, meaning_vi, han_viet) VALUES
    (1,'日',1,'N5',4,'72','ニチ、ジツ','ひ','day; sun','ngày','Nhật, Nhựt'),
    (2,'週',3,'N4',11,'162','シュウ','','week',NULL,'Chu')`);
  t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
    (1,'日曜日','にちようび','nichiyoubi','N5',1)`);
  t.raw.exec(`INSERT INTO kanji_words (kanji_id, word_id) VALUES (1,1)`);
}

describe("kanji.repo", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
    seed(t);
  });

  it("searchKanji theo literal", async () => {
    const r = await searchKanji(t.q, "日");
    expect(r[0]?.literal).toBe("日");
  });

  it("searchKanji theo nghĩa tiếng Anh", async () => {
    const r = await searchKanji(t.q, "day");
    expect(r.some((k) => k.literal === "日")).toBe(true);
  });

  it("searchKanji theo âm Hán-Việt và nghĩa tiếng Việt (không phân biệt hoa thường)", async () => {
    expect((await searchKanji(t.q, "nhật")).map((k) => k.literal)).toEqual(["日"]);
    expect((await searchKanji(t.q, "ngày")).map((k) => k.literal)).toEqual(["日"]);
    expect((await searchKanji(t.q, "chu"))[0]?.han_viet).toBe("Chu");
    t.raw.exec(`INSERT INTO kanji (id, literal, jlpt_level, han_viet) VALUES (3,'道','N5','Đạo')`);
    expect((await searchKanji(t.q, "đạo")).map((k) => k.literal)).toEqual(["道"]);
  });

  it("listByLevel lọc đúng cấp", async () => {
    const n5 = await listByLevel(t.q, "N5");
    expect(n5.map((k) => k.literal)).toEqual(["日"]);
  });

  it("getKanjiDetail kèm từ chứa kanji", async () => {
    const d = await getKanjiDetail(t.q, 1);
    expect(d?.on_readings).toContain("ニチ");
    expect(d?.words[0]?.headword).toBe("日曜日");
  });

  it("getKanjiDetail trả null khi không có", async () => {
    expect(await getKanjiDetail(t.q, 999)).toBeNull();
  });
});
