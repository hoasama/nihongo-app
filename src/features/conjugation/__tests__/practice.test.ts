// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isCorrect, pickQuestion, practicePool } from "../practice";

const w = (id: number, headword: string, reading_kana: string, pos: string) => ({ id, headword, reading_kana, gloss: null, pos });
const te = { id: "te", name: "Thể て", level: "N5" as const, w: "書いて", k: "かいて" };

describe("practice", () => {
  it("chấm đúng với kana, kanji, romaji; sai với dạng khác", () => {
    expect(isCorrect("かいて", te)).toBe(true);
    expect(isCorrect(" 書いて ", te)).toBe(true);
    expect(isCorrect("kaite", te)).toBe(true);
    expect(isCorrect("かきて", te)).toBe(false);
    expect(isCorrect("", te)).toBe(false);
  });

  it("vốn từ bỏ danh từ + する và từ sai loại", () => {
    const pool = practicePool(
      [w(1, "書く", "かく", "&v5k;"), w(2, "勉強", "べんきょう", "&n;,&vs;"), w(3, "高い", "たかい", "&adj-i;")],
      "verb",
    );
    expect(pool.map((x) => x.id)).toEqual([1]);
  });

  it("chọn câu hỏi trong các thể được yêu cầu, bỏ qua từ không có thể đó", () => {
    const pool = [w(1, "有る", "ある", "&v5r-i;"), w(2, "書く", "かく", "&v5k;")];
    let i = 0;
    const seq = [0, 0, 0.9, 0]; // lần 1 chọn ある (không có pot) → thử lại, chọn 書く
    const q = pickQuestion(pool, "verb", ["pot"], () => seq[i++ % seq.length]);
    expect(q?.word.headword).toBe("書く");
    expect(q?.form.w).toBe("書ける");
    expect(q?.base.w).toBe("書く");
  });

  it("không hỏi thể trùng đề bài (thể từ điển)", () => {
    const pool = [w(1, "書く", "かく", "&v5k;")];
    expect(pickQuestion(pool, "verb", ["dict"], () => 0)).toBeNull();
    expect(pickQuestion(pool, "verb", ["dict", "te"], () => 0)?.form.id).toBe("te");
  });

  it("đề bài tính từ な là từ gốc, không kèm だ", () => {
    const q = pickQuestion([w(1, "静か", "しずか", "&adj-na;")], "adj", ["neg"], () => 0);
    expect(q?.base.w).toBe("静か");
    expect(q?.form.w).toBe("静かじゃない");
  });
});
