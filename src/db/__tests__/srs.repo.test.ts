// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { ensurePresetDecks, listDecks } from "../srs.repo";

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
