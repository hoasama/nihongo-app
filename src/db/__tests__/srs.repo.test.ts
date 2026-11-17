// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { ensurePresetDecks, listDecks } from "../srs.repo";
import { introduceNewCards, getDeckCounts } from "../srs.repo";
import { getDueCards, getCardContent, recordReview } from "../srs.repo";

describe("srs.repo decks", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
  });

  it("ensurePresetDecks tạo đúng 6 deck (3 vocab + 3 kanji), idempotent", async () => {
    await ensurePresetDecks(t.q);
    await ensurePresetDecks(t.q); // lần 2 không tạo thêm
    const all = t.raw.prepare("SELECT category, COUNT(*) c FROM decks GROUP BY category").all();
    expect(all).toEqual([
      { category: "kanji", c: 3 },
      { category: "vocab", c: 3 },
    ]);
  });

  it("listDecks lọc theo category", async () => {
    await ensurePresetDecks(t.q);
    const vocab = await listDecks(t.q, "vocab");
    const kanji = await listDecks(t.q, "kanji");
    expect(vocab).toHaveLength(3);
    expect(kanji).toHaveLength(3);
    expect(vocab.every((d) => d.category === "vocab")).toBe(true);
  });
});

function seedVocab(t: TestDb) {
  t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
    (1,'食べる','たべる','taberu','N5',1),
    (2,'飲む','のむ','nomu','N5',1),
    (3,'持つ','もつ','motsu','N4',0)`);
}

describe("srs.repo introduce + counts", () => {
  let t: TestDb;
  let n5VocabId: number;
  beforeEach(async () => {
    t = makeTestDb();
    seedVocab(t);
    await ensurePresetDecks(t.q);
    const d = await listDecks(t.q, "vocab");
    n5VocabId = d.find((x) => x.level === "N5")!.id;
  });

  it("introduceNewCards tạo 2 thẻ/mục (recognition+production), tôn trọng limit", async () => {
    const created = await introduceNewCards(t.q, n5VocabId, 1); // 1 mục mới
    expect(created).toHaveLength(2);
    expect(new Set(created.map((c) => c.direction))).toEqual(
      new Set(["recognition", "production"]),
    );
    const total = t.raw.prepare("SELECT COUNT(*) c FROM cards").get() as { c: number };
    expect(total.c).toBe(2);
  });

  it("introduceNewCards không lặp mục đã có thẻ", async () => {
    await introduceNewCards(t.q, n5VocabId, 1);
    await introduceNewCards(t.q, n5VocabId, 1); // mục kế, không trùng
    const items = t.raw
      .prepare("SELECT DISTINCT item_id FROM cards ORDER BY item_id")
      .all() as { item_id: number }[];
    expect(items.map((x) => x.item_id)).toEqual([1, 2]);
  });

  it("getDeckCounts: due = thẻ đến hạn; newRemaining theo pool & limit ngày", async () => {
    // N5 vocab pool = {1,2}. Chưa có thẻ nào.
    const before = await getDeckCounts(t.q, n5VocabId, 10);
    expect(before.due).toBe(0);
    expect(before.newRemaining).toBe(2); // min(pool=2, limit=10)

    await introduceNewCards(t.q, n5VocabId, 2); // giới thiệu cả 2 mục hôm nay
    const after = await getDeckCounts(t.q, n5VocabId, 10);
    expect(after.due).toBe(4); // 2 mục × 2 thẻ, due = now
    expect(after.newRemaining).toBe(0); // pool cạn
  });
});

describe("srs.repo due/content/review", () => {
  let t: TestDb;
  let deckId: number;
  beforeEach(async () => {
    t = makeTestDb();
    t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
      (1,'食べる','たべる','taberu','N5',1)`);
    t.raw.exec(`INSERT INTO senses (word_id, part_of_speech, gloss_en, gloss_vi, order_idx) VALUES
      (1,'v1','to eat','ăn',0)`);
    t.raw.exec(`INSERT INTO sentences (id, jp_text, furigana, translation_en, source) VALUES
      (1,'ご飯を食べる。','ご{飯|はん}を{食|た}べる。','I eat rice.','tatoeba:1')`);
    t.raw.exec(`INSERT INTO sentence_words (sentence_id, word_id) VALUES (1,1)`);
    await ensurePresetDecks(t.q);
    deckId = (await listDecks(t.q, "vocab")).find((d) => d.level === "N5")!.id;
    await introduceNewCards(t.q, deckId, 1);
  });

  it("getDueCards trả thẻ đến hạn của deck", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    expect(due.length).toBe(2); // 1 mục × 2 chiều, due = now
    expect(due[0].deck_id).toBe(deckId);
  });

  it("getCardContent (word) trả japanese/reading/meaning + ví dụ (ưu tiên gloss_vi)", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    const content = await getCardContent(t.q, due[0]);
    expect(content.japanese).toBe("食べる");
    expect(content.reading).toBe("たべる");
    expect(content.meaning).toBe("ăn");
    expect(content.exampleJp).toBe("ご飯を食べる。");
    expect(content.exampleEn).toBe("I eat rice.");
  });

  it("recordReview good: cập nhật card + ghi 1 dòng reviews", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    await recordReview(t.q, due[0], "good");
    const card = t.raw.prepare("SELECT repetitions, interval_days FROM cards WHERE id = ?").get(due[0].id) as { repetitions: number; interval_days: number };
    expect(card.repetitions).toBe(1);
    expect(card.interval_days).toBe(1);
    const rev = t.raw.prepare("SELECT COUNT(*) c FROM reviews WHERE card_id = ?").get(due[0].id) as { c: number };
    expect(rev.c).toBe(1);
  });
});
