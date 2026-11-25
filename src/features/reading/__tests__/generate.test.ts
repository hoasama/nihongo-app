// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "../../../db/__tests__/makeTestDb";
import { buildPrompt, loadControlledLists } from "../generate";

describe("danh sách kiểm soát cho bài đọc", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
    t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
      (1,'食べる','たべる','taberu','N5',1),
      (2,'安全','あんぜん','anzen','N4',1)`);
    t.raw.exec(`INSERT INTO grammar (id, title, jlpt_level, structure, meaning_vi, explanation_vi, examples_json) VALUES
      (1,'〜です','N5','N＋です','là','gt','[]')`);
  });

  it("N5 không lấy từ của level cao hơn", async () => {
    const l = await loadControlledLists(t.q, "N5");
    expect(l.words).toEqual(["食べる"]);
    expect(l.grammar).toEqual(["〜です"]);
    expect(l).toMatchObject({ hasLevelWords: true, hasLevelGrammar: true });
  });

  it("N4 gồm cả N5 và báo thiếu ngữ pháp N4", async () => {
    const l = await loadControlledLists(t.q, "N4");
    expect(l.words.sort()).toEqual(["安全", "食べる"].sort());
    expect(l).toMatchObject({ hasLevelWords: true, hasLevelGrammar: false });
  });

  it("gộp ngữ pháp từ level đang chọn trở xuống", async () => {
    t.raw.exec(`INSERT INTO grammar (id, title, jlpt_level) VALUES (2,'〜ようにする','N4')`);
    const n4 = await loadControlledLists(t.q, "N4");
    expect(n4.grammar).toEqual(["〜です", "〜ようにする"]);
    expect(n4.hasLevelGrammar).toBe(true);
    expect((await loadControlledLists(t.q, "N5")).grammar).toEqual(["〜です"]);
  });

  it("level chưa có từ thì prompt không ép chỉ dùng danh sách", async () => {
    const l = await loadControlledLists(t.q, "N3");
    expect(l.hasLevelWords).toBe(false);
    const prompt = buildPrompt("N3", "ẩm thực", l);
    expect(prompt).toContain("安全");
    expect(prompt).not.toContain("CHỈ dùng từ trong danh sách");
  });

  it("level đủ từ thì prompt ép dùng danh sách", async () => {
    const prompt = buildPrompt("N5", "ẩm thực", await loadControlledLists(t.q, "N5"));
    expect(prompt).toContain("CHỈ dùng từ trong danh sách");
    expect(prompt).not.toContain("安全");
  });
});
