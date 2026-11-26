// @vitest-environment node
import { describe, it, expect } from "vitest";
import { assignViMeanings, parseViMeanings, viKey } from "../src/parseViMeanings";
import type { WordRecord } from "../src/parseJmdict";

const w = (headword: string, reading_kana: string, is_common = false, freq_rank: number | null = null, usually_kana = false): WordRecord =>
  ({ headword, reading_kana, senses: [], is_common, freq_rank, usually_kana });

describe("assignViMeanings", () => {
  it("khớp đúng trước, rồi dự phòng: khác cách đọc, bỏ する, từ kana ghi bằng kanji", () => {
    const words = [w("食べる", "たべる"), w("四", "し"), w("勉強", "べんきょう"), w("射る", "いる"), w("居る", "いる", true, 1)];
    const vi = new Map([
      [viKey("食べる", "たべる"), "ăn"],
      [viKey("四", "よん"), "bốn"],
      [viKey("勉強する", "べんきょうする"), "học"],
      [viKey("いる", "いる"), "có, ở"],
      [viKey("無", "む"), "x"],
    ]);
    const { byIdx, missed } = assignViMeanings(words, vi);
    expect([...byIdx].sort()).toEqual([[0, "ăn"], [1, "bốn"], [2, "học"], [4, "có, ở"]]);
    expect(missed).toEqual([viKey("無", "む")]);
  });

  it("từ kana: chọn entry &uk; trước entry thông dụng hơn", () => {
    const words = [w("擦る", "する", true, 36), w("為る", "する", true, 50, true)];
    const { byIdx } = assignViMeanings(words, new Map([[viKey("する", "する"), "làm"]]));
    expect([...byIdx]).toEqual([[1, "làm"]]);
  });
});

describe("parseViMeanings", () => {
  it("đọc cả định dạng 5 cột (curated) và 3 cột (auto), bỏ chú thích", () => {
    const curated = "# level|kanji|kana|nghĩa|loại\nn5|私|わたし|tôi|n\r\n\n";
    const auto = "# kanji|kana|nghĩa\n青|あお|màu xanh (lam, lục)\nthiếu|cột\n";
    expect([...parseViMeanings(curated)]).toEqual([[viKey("私", "わたし"), "tôi"]]);
    expect([...parseViMeanings(auto)]).toEqual([[viKey("青", "あお"), "màu xanh (lam, lục)"]]);
  });

  it("chuẩn hoá nghĩa về NFC", () => {
    const nfd = "ăn".normalize("NFD");
    expect(parseViMeanings(`食べる|たべる|${nfd}`).get(viKey("食べる", "たべる"))).toBe("ăn");
  });
});
