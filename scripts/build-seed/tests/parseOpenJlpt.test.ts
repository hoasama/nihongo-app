// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseOpenJlpt, parseOpenJlptKanji } from "../src/parseOpenJlpt";

describe("parseOpenJlpt", () => {
  it("parse entry: word/reading/level + examples (ja/en/furigana/tatoeba_id)", () => {
    const json = JSON.stringify([
      {
        word: "会う",
        reading: "あう",
        level: "N5",
        examples: [
          {
            ja: "また会いましょう。",
            furigana: "また{会|あ}いましょう。",
            en: "Let's meet again.",
            tatoeba_id: 123,
          },
        ],
      },
      { word: "青", reading: "あお", level: "N5", examples: [] },
    ]);
    const recs = parseOpenJlpt(json);
    expect(recs).toHaveLength(2);
    expect(recs[0].word).toBe("会う");
    expect(recs[0].reading).toBe("あう");
    expect(recs[0].level).toBe("N5");
    expect(recs[0].examples[0].ja).toBe("また会いましょう。");
    expect(recs[0].examples[0].en).toBe("Let's meet again.");
    expect(recs[0].examples[0].furigana).toBe("また{会|あ}いましょう。");
    expect(recs[0].examples[0].tatoeba_id).toBe(123);
    expect(recs[1].examples).toHaveLength(0);
  });

  it("bỏ qua entry thiếu word hoặc reading", () => {
    const json = JSON.stringify([
      { word: "", reading: "あ", level: "N5", examples: [] },
      { word: "犬", reading: "", level: "N5", examples: [] },
    ]);
    expect(parseOpenJlpt(json)).toHaveLength(0);
  });

  it("chỉ giữ cấp N5/N4, bỏ cấp khác", () => {
    const json = JSON.stringify([
      { word: "会う", reading: "あう", level: "N5", examples: [] },
      { word: "難解", reading: "なんかい", level: "N1", examples: [] },
    ]);
    const recs = parseOpenJlpt(json);
    expect(recs).toHaveLength(1);
    expect(recs[0].level).toBe("N5");
  });

  it("chuẩn hoá example thiếu field (en/furigana/tatoeba_id = null)", () => {
    const json = JSON.stringify([
      {
        word: "本",
        reading: "ほん",
        level: "N5",
        examples: [{ ja: "本を読む。" }],
      },
    ]);
    const recs = parseOpenJlpt(json);
    expect(recs[0].examples[0].ja).toBe("本を読む。");
    expect(recs[0].examples[0].en).toBeNull();
    expect(recs[0].examples[0].furigana).toBeNull();
    expect(recs[0].examples[0].tatoeba_id).toBeNull();
  });
});

describe("parseOpenJlptKanji", () => {
  it("lấy character + level, chỉ giữ N5/N4", () => {
    const json = JSON.stringify([
      { character: "日", level: "N5", strokes: 4 },
      { character: "持", level: "N4", strokes: 9 },
      { character: "鬱", level: "N1", strokes: 29 },
    ]);
    const recs = parseOpenJlptKanji(json);
    expect(recs).toHaveLength(2);
    expect(recs[0]).toEqual({ character: "日", level: "N5" });
    expect(recs[1]).toEqual({ character: "持", level: "N4" });
  });

  it("bỏ entry thiếu character", () => {
    const json = JSON.stringify([{ character: "", level: "N5" }]);
    expect(parseOpenJlptKanji(json)).toHaveLength(0);
  });
});
