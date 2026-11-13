import { XMLParser } from "fast-xml-parser";

export interface KanjiRecord {
  literal: string;
  grade: number | null;
  stroke_count: number | null;
  radical: string | null;
  on_readings: string; // phân tách bằng '、'
  kun_readings: string;
  meaning_en: string; // phân tách bằng '; '
  freq_rank: number | null;
  jlpt_old: number | null; // JLPT cũ (1-4) từ KANJIDIC2; map N5/N4 ở bước sau
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) =>
    ["character", "rmgroup", "reading", "meaning", "rad_value"].includes(name),
});

interface RawReading {
  "#text"?: string | number;
  "@_r_type"?: string;
}
interface RawMeaning {
  "#text"?: string;
  "@_m_lang"?: string;
}
interface RawChar {
  literal?: string | number;
  radical?: { rad_value?: { "#text"?: string | number }[] };
  misc?: {
    grade?: number;
    stroke_count?: number | number[];
    freq?: number;
    jlpt?: number;
  };
  reading_meaning?: {
    rmgroup?: { reading?: RawReading[]; meaning?: (RawMeaning | string)[] }[];
  };
}

function first<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function toKanji(c: RawChar): KanjiRecord {
  const rm = c.reading_meaning?.rmgroup?.[0];
  const readings = rm?.reading ?? [];
  const on = readings
    .filter((r) => r["@_r_type"] === "ja_on")
    .map((r) => String(r["#text"]));
  const kun = readings
    .filter((r) => r["@_r_type"] === "ja_kun")
    .map((r) => String(r["#text"]));
  // Nghĩa không có thuộc tính m_lang = tiếng Anh (parser trả string khi không có attr).
  const meaningsEn = (rm?.meaning ?? [])
    .filter((m) => typeof m === "string")
    .map((m) => m as string);

  return {
    literal: String(c.literal ?? ""),
    grade: c.misc?.grade ?? null,
    stroke_count: first(c.misc?.stroke_count) ?? null,
    radical: c.radical?.rad_value?.[0]?.["#text"]
      ? String(c.radical.rad_value[0]["#text"])
      : null,
    on_readings: on.join("、"),
    kun_readings: kun.join("、"),
    meaning_en: meaningsEn.join("; "),
    freq_rank: c.misc?.freq ?? null,
    jlpt_old: c.misc?.jlpt ?? null,
  };
}

/** Parse đoạn XML chứa 1+ <character> của KANJIDIC2 thành KanjiRecord[]. */
export function parseKanjidicChar(xml: string): KanjiRecord[] {
  const root = parser.parse(xml) as { character?: RawChar[] };
  return (root.character ?? []).map(toKanji);
}
