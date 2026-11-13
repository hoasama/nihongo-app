export interface SentenceRecord {
  jp_text: string;
  translation_en: string | null;
  source: string;
}

/**
 * Parse file Tatoeba `sentences.csv` (tab-separated: id<TAB>lang<TAB>text).
 * Chỉ giữ câu tiếng Nhật (lang === 'jpn').
 */
export function parseTatoeba(csv: string): SentenceRecord[] {
  const out: SentenceRecord[] = [];
  for (const line of csv.split("\n")) {
    const trimmed = line.replace(/\r$/, "");
    if (!trimmed) continue;
    const [id, lang, text] = trimmed.split("\t");
    if (lang !== "jpn" || !text) continue;
    out.push({ jp_text: text, translation_en: null, source: `tatoeba:${id}` });
  }
  return out;
}
