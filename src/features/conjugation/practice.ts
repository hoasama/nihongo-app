// Logic phần luyện chia thể: chọn câu hỏi ngẫu nhiên và chấm câu trả lời.
import { toHiragana } from "wanakana";
import { conjugate, type ConjForm, type ConjKind } from "../dictionary/conjugate";
import type { ConjugatableWord } from "../../db/words.repo";

export interface Question {
  word: ConjugatableWord;
  /** dạng từ điển để hiện đề bài (vd 勉強 → 勉強する) */
  base: ConjForm;
  form: ConjForm;
}

/** Bảng chia hợp lệ cho bài luyện: đúng loại; động từ bỏ danh từ + する để tập trung vào động từ thật. */
function tableFor(w: ConjugatableWord, kind: ConjKind) {
  const t = conjugate(w.headword, w.reading_kana, w.pos.split("|"));
  if (!t || t.kind !== kind || t.title.includes("+ する")) return null;
  return t;
}

/** Lọc vốn từ dùng được cho `kind`. */
export const practicePool = (words: ConjugatableWord[], kind: ConjKind) =>
  words.filter((w) => tableFor(w, kind) !== null);

export function pickQuestion(
  pool: ConjugatableWord[],
  kind: ConjKind,
  formIds: string[],
  rand: () => number = Math.random,
): Question | null {
  for (let tries = 0; tries < 20 && pool.length; tries++) {
    const word = pool[Math.floor(rand() * pool.length)];
    const t = tableFor(word, kind);
    if (!t) continue;
    // Đề bài là dạng từ điển; tính từ な dùng từ gốc (静か), không phải thể thường (静かだ).
    const base = kind === "adj" ? { ...t.forms[0], w: word.headword, k: word.reading_kana } : t.forms[0];
    // Bỏ thể trùng đề bài (thể từ điển, 高い thể thường); ある không có thể khả năng...
    const forms = t.forms.filter((f) => formIds.includes(f.id) && f.k !== base.k);
    if (!forms.length) continue;
    return { word, base, form: forms[Math.floor(rand() * forms.length)] };
  }
  return null;
}

/** Đúng nếu khớp dạng kana hoặc dạng viết; nhận cả romaji (kaite → かいて). */
export function isCorrect(input: string, form: ConjForm): boolean {
  const a = input.trim().replace(/\s+/g, "").normalize("NFC");
  if (!a) return false;
  return [a, toHiragana(a)].some((x) => x === form.k || x === form.w);
}
