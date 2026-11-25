import type { JlptLevel } from "./jlptLevels";

export interface OpenJlptExample {
  ja: string;
  en: string | null;
  furigana: string | null;
  tatoeba_id: number | null;
}

export interface OpenJlptEntry {
  word: string;
  reading: string;
  level: JlptLevel;
  examples: OpenJlptExample[];
}

const KEPT_LEVELS = new Set<string>(["N5", "N4", "N3"]);

/**
 * Parse file vocab OpenJLPT (mảng JSON theo cấp, vd data/json/vocab/n5.json).
 * Giữ entry có word+reading và cấp N5/N4/N3; chuẩn hoá examples (field thiếu → null).
 * Nguồn: evanclan/OpenJLPT (CC BY-SA 4.0) — ví dụ gốc từ Tatoeba (CC BY).
 */
export function parseOpenJlpt(json: string): OpenJlptEntry[] {
  const arr = JSON.parse(json) as unknown[];
  const out: OpenJlptEntry[] = [];
  for (const raw of arr) {
    const e = raw as Record<string, unknown>;
    const word = typeof e.word === "string" ? e.word : "";
    const reading = typeof e.reading === "string" ? e.reading : "";
    const level = e.level;
    if (!word || !reading) continue;
    if (typeof level !== "string" || !KEPT_LEVELS.has(level)) continue;

    const rawExamples = Array.isArray(e.examples) ? e.examples : [];
    const examples: OpenJlptExample[] = [];
    for (const rx of rawExamples) {
      const x = rx as Record<string, unknown>;
      const ja = typeof x.ja === "string" ? x.ja : "";
      if (!ja) continue;
      examples.push({
        ja,
        en: typeof x.en === "string" ? x.en : null,
        furigana: typeof x.furigana === "string" ? x.furigana : null,
        tatoeba_id: typeof x.tatoeba_id === "number" ? x.tatoeba_id : null,
      });
    }

    out.push({ word, reading, level: level as JlptLevel, examples });
  }
  return out;
}

export interface OpenJlptKanji {
  character: string;
  level: JlptLevel;
}

/**
 * Parse file kanji OpenJLPT (data/json/kanji/n5.json...). Chỉ cần character + level
 * để gắn jlpt_level cho bảng kanji (các trường khác đã có từ KANJIDIC2).
 */
export function parseOpenJlptKanji(json: string): OpenJlptKanji[] {
  const arr = JSON.parse(json) as unknown[];
  const out: OpenJlptKanji[] = [];
  for (const raw of arr) {
    const e = raw as Record<string, unknown>;
    const character = typeof e.character === "string" ? e.character : "";
    const level = e.level;
    if (!character) continue;
    if (typeof level !== "string" || !KEPT_LEVELS.has(level)) continue;
    out.push({ character, level: level as JlptLevel });
  }
  return out;
}
