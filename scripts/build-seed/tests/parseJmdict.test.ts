// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseJmdictEntry } from "../src/parseJmdict";

const here = dirname(fileURLToPath(import.meta.url));

describe("parseJmdictEntry", () => {
  const xml = readFileSync(join(here, "fixtures/jmdict-sample.xml"), "utf8");

  it("parse entry có kanji thành WordRecord", () => {
    const recs = parseJmdictEntry(xml);
    expect(recs[0].headword).toBe("食べる");
    expect(recs[0].reading_kana).toBe("たべる");
    expect(recs[0].senses[0].gloss_en).toBe("to eat");
    expect(recs[0].senses[0].part_of_speech).toContain("v1");
  });

  it("entry không có kanji → headword lấy từ kana", () => {
    const recs = parseJmdictEntry(xml);
    expect(recs[1].headword).toBe("ある");
    expect(recs[1].reading_kana).toBe("ある");
    expect(recs[1].senses[0].gloss_en).toBe("to exist; to be");
  });
});
