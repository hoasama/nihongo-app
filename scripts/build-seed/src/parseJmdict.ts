import { XMLParser } from "fast-xml-parser";

export interface SenseRecord {
  part_of_speech: string;
  gloss_en: string;
}

export interface WordRecord {
  headword: string;
  reading_kana: string;
  senses: SenseRecord[];
  is_common: boolean;
  freq_rank: number | null; // nhỏ = hay dùng hơn (từ thẻ nfXX của JMdict)
}

// processEntities:false để không vỡ khi gặp entity DTD của JMdict (vd &v1;).
const parser = new XMLParser({
  ignoreAttributes: true,
  processEntities: false,
  isArray: (name) =>
    ["entry", "k_ele", "r_ele", "sense", "gloss", "pos"].includes(name),
});

type Pri = string | string[] | undefined;

interface RawEntry {
  k_ele?: { keb?: string; ke_pri?: Pri }[];
  r_ele?: { reb?: string; re_pri?: Pri }[];
  sense?: { pos?: string[]; gloss?: unknown[] }[];
}

/** Gom mọi thẻ priority thành mảng chuỗi. */
function flattenPri(pris: Pri[]): string[] {
  return pris.flatMap((p) => (Array.isArray(p) ? p : p != null ? [p] : []));
}

/** Tần suất: nhỏ nhất của nfXX; nếu chỉ có news/ichi/spec/gai → 50; không có → null. */
function freqOf(pris: string[]): number | null {
  let best: number | null = null;
  for (const p of pris) {
    const m = /^nf(\d+)$/.exec(p);
    if (m) {
      const n = parseInt(m[1], 10);
      best = best == null ? n : Math.min(best, n);
    }
  }
  if (best != null) return best;
  return pris.length ? 50 : null;
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
  // JMdict đánh dấu từ thông dụng bằng thẻ ke_pri/re_pri (news1, ichi1, nfXX…).
  const pris = flattenPri([
    ...(e.k_ele ?? []).map((k) => k.ke_pri),
    ...(e.r_ele ?? []).map((r) => r.re_pri),
  ]);
  const freq_rank = freqOf(pris);
  return {
    headword,
    reading_kana,
    senses,
    is_common: freq_rank != null,
    freq_rank,
  };
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
