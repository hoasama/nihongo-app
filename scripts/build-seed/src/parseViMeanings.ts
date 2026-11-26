import type { WordRecord } from "./parseJmdict";

/** Khoá tra nghĩa tiếng Việt: cách viết + cách đọc (phân biệt từ đồng tự khác âm). */
export const viKey = (headword: string, kana: string) => `${headword}|${kana}`;

/**
 * Đọc file nghĩa tiếng Việt (dòng `#` là chú thích) thành map `kanji|kana` → nghĩa.
 * - vi-curated.tsv: `level|kanji|kana|nghĩa|loại`
 * - vi-auto.tsv:    `kanji|kana|nghĩa`
 * Nhận diện theo số cột. Nghĩa được chuẩn hoá NFC để FTS khớp với chữ người dùng gõ.
 */
export function parseViMeanings(tsv: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of tsv.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const c = line.split("|").map((s) => s.trim());
    const [kanji, kana, vi] = c.length >= 5 ? c.slice(1, 4) : c;
    if (kanji && kana && vi) out.set(viKey(kanji, kana), vi.normalize("NFC"));
  }
  return out;
}

const better = (a: WordRecord, b: WordRecord) =>
  Number(b.is_common) - Number(a.is_common) || (a.freq_rank ?? 1e9) - (b.freq_rank ?? 1e9);

/**
 * Gán nghĩa Việt cho từng từ JMdict (theo chỉ số trong `words`). Trả thêm các khoá không khớp.
 * Khớp đúng kanji+kana trước; khoá còn lại thử lần lượt (chọn từ thông dụng nhất, chưa có nghĩa):
 *  1. cùng cách viết, khác cách đọc (四|よん → entry 四 đọc し)
 *  2. bỏ đuôi する (勉強する → 勉強)
 *  3. từ chỉ viết kana mà JMdict ghi bằng kanji (する → 為る), khớp theo cách đọc, ưu tiên entry &uk;
 */
export function assignViMeanings(words: WordRecord[], vi: Map<string, string>) {
  const byIdx = new Map<number, string>();
  const used = new Set<string>();
  words.forEach((w, i) => {
    const m = vi.get(viKey(w.headword, w.reading_kana));
    if (m) {
      byIdx.set(i, m);
      used.add(viKey(w.headword, w.reading_kana));
    }
  });
  const byHead = new Map<string, number[]>();
  const byKana = new Map<string, number[]>();
  words.forEach((w, i) => {
    byHead.set(w.headword, [...(byHead.get(w.headword) ?? []), i]);
    byKana.set(w.reading_kana, [...(byKana.get(w.reading_kana) ?? []), i]);
  });
  const missed: string[] = [];
  for (const [key, m] of vi) {
    if (used.has(key)) continue;
    const [kanji, kana] = key.split("|");
    const base = kanji.endsWith("する") ? kanji.slice(0, -2) : null;
    const tries = [
      byHead.get(kanji) ?? [],
      base ? (byHead.get(base) ?? []).filter((i) => words[i].reading_kana === kana.slice(0, -2)) : [],
      // ưu tiên entry gắn &uk;: する → 為る, không phải 擦る (thông dụng hơn nhưng viết bằng kanji)
      kanji === kana ? (byKana.get(kana) ?? []).filter((i) => words[i].usually_kana) : [],
      kanji === kana ? (byKana.get(kana) ?? []) : [],
    ];
    const pick = tries
      .map((c) => c.filter((i) => !byIdx.has(i)).sort((a, b) => better(words[a], words[b]))[0])
      .find((i) => i !== undefined);
    if (pick === undefined) missed.push(key);
    else byIdx.set(pick, m);
  }
  return { byIdx, missed };
}
