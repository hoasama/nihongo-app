// Sinh bài đọc bằng Claude theo chủ đề + level. Gọi trực tiếp Anthropic API từ
// renderer (Electron không set CSP). Bài sinh ra khớp interface Reading sẵn có.
import type { Reading, ReadingLevel } from "./readings";
import { getDb } from "../../db/client";
import type { Queryable } from "../../db/queryable";
import { listWords } from "../../db/words.repo";
import { listGrammar } from "../../db/grammar.repo";

const LS_KEY = "reading.geminiKey";
const LS_MODEL = "reading.geminiModel";
const LS_GENERATED = "reading.generated";
const DEFAULT_MODEL = "gemini-3.8-flash";
const RETIRED_MODEL = "gemini-2.0-flash"; // có thể còn lưu trong localStorage, API trả 404

export const getKey = () => localStorage.getItem(LS_KEY) ?? "";
export const setKey = (v: string) => localStorage.setItem(LS_KEY, v.trim());
export const getModel = () => {
  const saved = localStorage.getItem(LS_MODEL);
  return !saved || saved === RETIRED_MODEL ? DEFAULT_MODEL : saved;
};
export const setModel = (v: string) =>
  localStorage.setItem(LS_MODEL, v.trim() || DEFAULT_MODEL);

export function loadGenerated(): Reading[] {
  try {
    const r = JSON.parse(localStorage.getItem(LS_GENERATED) ?? "[]");
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}
export function saveGenerated(list: Reading[]) {
  localStorage.setItem(LS_GENERATED, JSON.stringify(list));
}

const LEVEL_ORDER: ReadingLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export interface ControlledLists {
  words: string[];
  grammar: string[];
  hasLevelWords: boolean; // seed có từ của đúng level này không
  hasLevelGrammar: boolean; // tương tự cho ngữ pháp
}

/** Từ vựng + ngữ pháp từ level đang chọn trở xuống, lấy từ seed DB. */
export async function loadControlledLists(
  db: Queryable,
  level: ReadingLevel,
): Promise<ControlledLists> {
  const levels = LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(level) + 1);
  const [words, grammar] = await Promise.all([
    Promise.all(levels.map((l) => listWords(db, l, undefined, 5000))),
    Promise.all(levels.map((l) => listGrammar(db, l))),
  ]);
  return {
    words: [...new Set(words.flat().map((w) => w.headword))],
    grammar: [...new Set(grammar.flat().map((g) => g.title))],
    hasLevelWords: words[words.length - 1].length > 0,
    hasLevelGrammar: grammar[grammar.length - 1].length > 0,
  };
}

export const buildPrompt = (
  level: ReadingLevel,
  topic: string,
  lists: ControlledLists,
) => `Bạn là biên tập viên soạn bài đọc tiếng Nhật cho người học trình độ JLPT ${level}.
Viết MỘT bài đọc về chủ đề: "${topic}".

DANH SÁCH TỪ VỰNG:
${lists.words.join("、")}

DANH SÁCH NGỮ PHÁP:
${lists.grammar.join("、")}

Yêu cầu:
- Dài 200–500 ký tự tiếng Nhật, chia thành 5–9 câu.
- ${
  lists.hasLevelWords
    ? "Từ vựng: CHỈ dùng từ trong danh sách và các dạng chia của chúng. Ngoại lệ: tên riêng và tối đa 3 từ bắt buộc phải có cho chủ đề."
    : `Từ vựng: ưu tiên từ trong danh sách; chỉ thêm từ thông dụng đúng trình độ ${level} khi cần.`
}
- ${
  lists.hasLevelGrammar
    ? `Ngữ pháp: ưu tiên mẫu trong danh sách; ngoài ra chỉ dùng trợ từ và mẫu câu cơ bản của ${level}.`
    : `Ngữ pháp: dùng mẫu trong danh sách và mẫu phổ biến của ${level}, không dùng mẫu khó hơn ${level}.`
}
- Văn phong dễ hiểu, rõ ràng theo kiểu "NHK News Web Easy" (やさしい日本語).
- MỌI chữ Hán (kanji) phải có furigana ở dạng markup "{漢字|かな}", ví dụ "{私|わたし}は{毎日|まいにち}{勉強|べんきょう}します". Kana và dấu câu để trơn, KHÔNG bọc.
- Mỗi câu kèm bản dịch tiếng Việt tự nhiên.

Chỉ trả về JSON hợp lệ, KHÔNG kèm giải thích hay markdown, theo đúng dạng:
{"titleJp":"...","titleVi":"...","sentences":[{"jp":"{漢字|かな}...","vi":"..."}]}`;

function parseReading(text: string, level: ReadingLevel): Reading {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Không tìm thấy JSON trong phản hồi.");
  const obj = JSON.parse(text.slice(start, end + 1));
  if (!obj.titleJp || !Array.isArray(obj.sentences) || obj.sentences.length === 0)
    throw new Error("JSON thiếu titleJp hoặc sentences.");
  for (const s of obj.sentences)
    if (typeof s?.jp !== "string" || typeof s?.vi !== "string")
      throw new Error("Câu trong JSON sai định dạng.");
  return {
    id: `gen-${Date.now()}`,
    level,
    titleJp: String(obj.titleJp),
    titleVi: String(obj.titleVi ?? ""),
    sentences: obj.sentences.map((s: { jp: string; vi: string }) => ({
      jp: s.jp,
      vi: s.vi,
    })),
  };
}

export async function generateReading(
  level: ReadingLevel,
  topic: string,
): Promise<Reading> {
  const key = getKey();
  if (!key) throw new Error("Chưa nhập API key của Gemini.");
  if (!topic.trim()) throw new Error("Hãy nhập chủ đề.");

  const lists = await loadControlledLists(getDb(), level);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(90_000), // fetch không tự timeout, tránh kẹt "Đang tạo" mãi
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(level, topic.trim(), lists) }] }],
      generationConfig: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Lỗi API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts: { text?: string }[] = candidate?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  if (candidate?.finishReason === "MAX_TOKENS")
    throw new Error("Bài bị cắt vì quá dài. Hãy thử tạo lại.");
  if (!text) {
    const reason = data?.promptFeedback?.blockReason ?? candidate?.finishReason ?? "không rõ";
    throw new Error(`Gemini không trả nội dung (lý do: ${reason}).`);
  }
  return parseReading(text, level);
}
