// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { searchWords, getWordDetail } from "../words.repo";

function seed(t: TestDb) {
  t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
    (1,'食べる','たべる','taberu','N5',1),
    (2,'持つ','もつ','motsu','N4',0)`);
  t.raw.exec(`INSERT INTO senses (word_id, part_of_speech, gloss_en, gloss_vi, order_idx) VALUES
    (1,'v1','to eat','ăn',0),
    (2,'v5t','to hold','cầm',0)`);
  t.raw.exec(`INSERT INTO words_fts (headword, reading_kana, reading_romaji, gloss_en, gloss_vi, word_id) VALUES
    ('食べる','たべる','taberu','to eat','ăn',1),
    ('持つ','もつ','motsu','to hold','cầm',2)`);
  t.raw.exec(`INSERT INTO sentences (id, jp_text, translation_en, source) VALUES
    (1,'私はご飯を食べる。','I eat rice.','x')`);
  t.raw.exec(`INSERT INTO sentence_words (sentence_id, word_id) VALUES (1,1)`);
}

describe("words.repo", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
    seed(t);
  });

  it("searchWords tìm theo romaji prefix", async () => {
    const res = await searchWords(t.q, "tabe");
    expect(res.map((w) => w.headword)).toContain("食べる");
  });

  it("searchWords lọc theo cấp JLPT", async () => {
    const all = await searchWords(t.q, "mo");
    expect(all.some((w) => w.headword === "持つ")).toBe(true);
    const n5 = await searchWords(t.q, "mo", "N5");
    expect(n5.some((w) => w.headword === "持つ")).toBe(false);
  });

  it("getWordDetail trả chi tiết kèm senses + câu ví dụ", async () => {
    const d = await getWordDetail(t.q, 1);
    expect(d?.headword).toBe("食べる");
    expect(d?.senses[0].gloss_vi).toBe("ăn");
    expect(d?.sentences[0].jp_text).toContain("食べる");
  });

  it("getWordDetail trả null khi không tồn tại", async () => {
    expect(await getWordDetail(t.q, 999)).toBeNull();
  });
});
