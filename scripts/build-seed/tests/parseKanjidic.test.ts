// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseKanjidicChar } from "../src/parseKanjidic";

const here = dirname(fileURLToPath(import.meta.url));

describe("parseKanjidicChar", () => {
  const xml = readFileSync(join(here, "fixtures/kanjidic-sample.xml"), "utf8");

  it("parse 1 character thành KanjiRecord", () => {
    const [k] = parseKanjidicChar(xml);
    expect(k.literal).toBe("日");
    expect(k.stroke_count).toBe(4);
    expect(k.grade).toBe(1);
    expect(k.on_readings).toContain("ニチ");
    expect(k.kun_readings).toContain("ひ");
    expect(k.han_viet).toBe("Nhật, Nhựt");
  });

  it("chỉ giữ nghĩa tiếng Anh (bỏ nghĩa ngôn ngữ khác)", () => {
    const [k] = parseKanjidicChar(xml);
    expect(k.meaning_en).toContain("day");
    expect(k.meaning_en).not.toContain("jour");
  });
});
