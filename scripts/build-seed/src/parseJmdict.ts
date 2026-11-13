import { XMLParser } from "fast-xml-parser";

export interface SenseRecord {
  part_of_speech: string;
  gloss_en: string;
}

export interface WordRecord {
  headword: string;
  reading_kana: string;
  senses: SenseRecord[];
}

// processEntities:false để không vỡ khi gặp entity DTD của JMdict (vd &v1;).
const parser = new XMLParser({
  ignoreAttributes: true,
  processEntities: false,
  isArray: (name) =>
    ["entry", "k_ele", "r_ele", "sense", "gloss", "pos"].includes(name),
});

interface RawEntry {
  k_ele?: { keb?: string }[];
  r_ele?: { reb?: string }[];
  sense?: { pos?: string[]; gloss?: unknown[] }[];
}

function toWord(e: RawEntry): WordRecord {
  const kebs = (e.k_ele ?? []).map((k) => k.keb).filter(Boolean) as string[];
  const rebs = (e.r_ele ?? []).map((r) => r.reb).filter(Boolean) as string[];
  const reading_kana = rebs[0] ?? "";
  const headword = kebs[0] ?? reading_kana;
  const senses: SenseRecord[] = (e.sense ?? []).map((s) => ({
    part_of_speech: (s.pos ?? []).join(","),
    gloss_en: (s.gloss ?? []).map((g) => String(g)).join("; "),
  }));
  return { headword, reading_kana, senses };
}

/**
 * Parse XML JMdict thành WordRecord[]. Nhận cả file đầy đủ (root <JMdict>)
 * lẫn fragment chỉ gồm các <entry> (dùng cho fixture test).
 */
export function parseJmdictEntry(xml: string): WordRecord[] {
  const root = parser.parse(xml) as {
    JMdict?: { entry?: RawEntry[] };
    entry?: RawEntry[];
  };
  const entries = root.JMdict?.entry ?? root.entry ?? [];
  return entries.map(toWord);
}
