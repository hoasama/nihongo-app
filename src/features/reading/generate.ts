// Sinh bài đọc bằng LLM người dùng tự chọn (Gemini / OpenAI-compatible / Claude)
// theo chủ đề + level. Gọi trực tiếp API từ renderer (Electron không set CSP).
// Bài sinh ra khớp interface Reading sẵn có.
import Anthropic from "@anthropic-ai/sdk";
import type { Reading, ReadingLevel } from "./readings";
import { getDb } from "../../db/client";
import type { Queryable } from "../../db/queryable";
import { listWords } from "../../db/words.repo";
import { listGrammar } from "../../db/grammar.repo";

export type Provider = "gemini" | "openai" | "anthropic";

export interface LlmConfig {
  provider: Provider;
  key: string;
  model: string;
  baseUrl: string; // chỉ dùng cho openai-compatible
}

export const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI-compatible (OpenAI, OpenRouter, Ollama…)" },
  { value: "anthropic", label: "Claude (Anthropic)" },
];

export const DEFAULT_MODEL: Record<Provider, string> = {
  gemini: "gemini-3.8-flash",
  openai: "", // tên model tuỳ dịch vụ (OpenAI, OpenRouter, Ollama…) nên bắt người dùng nhập
  anthropic: "claude-opus-5-5",
};
export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const RETIRED_GEMINI = "gemini-2.0-flash"; // có thể còn lưu trong localStorage, API trả 404
const TIMEOUT_MS = 90_000; // fetch không tự timeout, tránh kẹt "Đang tạo" mãi

// Key Gemini giữ tên cũ (reading.geminiKey/geminiModel) để người dùng không phải nhập lại.
const ls = (p: Provider, f: "Key" | "Model" | "BaseUrl") => `reading.${p}${f}`;
const LS_PROVIDER = "reading.provider";
const LS_GENERATED = "reading.generated";

/** Cấu hình của một provider (mặc định provider đang chọn). */
export function getLlmConfig(provider?: Provider): LlmConfig {
  const p = provider ?? ((localStorage.getItem(LS_PROVIDER) as Provider | null) ?? "gemini");
  let model = localStorage.getItem(ls(p, "Model")) || DEFAULT_MODEL[p];
  if (model === RETIRED_GEMINI) model = DEFAULT_MODEL.gemini;
  return {
    provider: p,
    key: localStorage.getItem(ls(p, "Key")) ?? "",
    model,
    baseUrl: localStorage.getItem(ls(p, "BaseUrl")) || DEFAULT_BASE_URL,
  };
}

export function setLlmConfig(c: LlmConfig) {
  localStorage.setItem(LS_PROVIDER, c.provider);
  localStorage.setItem(ls(c.provider, "Key"), c.key.trim());
  localStorage.setItem(ls(c.provider, "Model"), c.model.trim() || DEFAULT_MODEL[c.provider]);
  if (c.provider === "openai")
    localStorage.setItem(ls("openai", "BaseUrl"), c.baseUrl.trim() || DEFAULT_BASE_URL);
}

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

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lỗi API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

const TOO_LONG = "Bài bị cắt vì quá dài. Hãy thử tạo lại.";

async function callGemini(c: LlmConfig, prompt: string): Promise<string> {
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent`,
    { "x-goog-api-key": c.key },
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    },
  );
  const candidate = data?.candidates?.[0];
  const parts: { text?: string }[] = candidate?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  if (candidate?.finishReason === "MAX_TOKENS") throw new Error(TOO_LONG);
  if (!text) {
    const reason = data?.promptFeedback?.blockReason ?? candidate?.finishReason ?? "không rõ";
    throw new Error(`Gemini không trả nội dung (lý do: ${reason}).`);
  }
  return text;
}

async function callOpenAI(c: LlmConfig, prompt: string): Promise<string> {
  // Không gửi response_format/max_tokens: nhiều server "OpenAI-compatible" không hỗ trợ; prompt đã ép JSON.
  const data = await postJson(
    `${c.baseUrl.replace(/\/+$/, "")}/chat/completions`,
    c.key ? { authorization: `Bearer ${c.key}` } : {}, // Ollama/LM Studio không cần key
    { model: c.model, messages: [{ role: "user", content: prompt }] },
  );
  const choice = data?.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error(TOO_LONG);
  const text: string = choice?.message?.content ?? "";
  if (!text) throw new Error(`Model không trả nội dung (lý do: ${choice?.finish_reason ?? "không rõ"}).`);
  return text;
}

// Model nhận server-side fallback khi bị từ chối (refusal); model khác gửi tham số này sẽ lỗi 400.
const CLAUDE_FALLBACK_MODELS = ["claude-opus-5-5", "claude-opus-5", "claude-fable-5-2", "claude-fable-5-1", "claude-sonnet-5-5"];

async function callClaude(c: LlmConfig, prompt: string): Promise<string> {
  // Key do chính người dùng nhập và chỉ lưu trên máy họ, nên gọi thẳng từ renderer là chấp nhận được.
  const client = new Anthropic({ apiKey: c.key, dangerouslyAllowBrowser: true, timeout: TIMEOUT_MS, maxRetries: 1 });
  const fallback = CLAUDE_FALLBACK_MODELS.includes(c.model);
  let msg: Anthropic.Beta.BetaMessage;
  try {
    msg = await client.beta.messages.create({
      model: c.model,
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
      ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
  } catch (e) {
    if (e instanceof Anthropic.APIConnectionTimeoutError) throw new DOMException("timeout", "TimeoutError");
    if (e instanceof Anthropic.AuthenticationError) throw new Error("API key của Claude không hợp lệ.");
    if (e instanceof Anthropic.NotFoundError) throw new Error(`Không tìm thấy model "${c.model}".`);
    if (e instanceof Anthropic.RateLimitError) throw new Error("Claude đang giới hạn tốc độ, hãy thử lại sau ít phút.");
    if (e instanceof Anthropic.APIError) throw new Error(`Lỗi API ${e.status ?? ""}: ${e.message.slice(0, 300)}`);
    throw e;
  }
  if (msg.stop_reason === "refusal") throw new Error("Claude từ chối tạo bài với chủ đề này. Hãy thử chủ đề khác.");
  if (msg.stop_reason === "max_tokens") throw new Error(TOO_LONG);
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  if (!text) throw new Error("Claude không trả nội dung.");
  return text;
}

const CALL: Record<Provider, (c: LlmConfig, prompt: string) => Promise<string>> = {
  gemini: callGemini,
  openai: callOpenAI,
  anthropic: callClaude,
};

// Gợi ý khi chưa có key / không lấy được danh sách từ API.
export const SUGGESTED_MODELS: Record<Provider, string[]> = {
  gemini: [DEFAULT_MODEL.gemini],
  openai: [],
  anthropic: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-2"],
};

async function getJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Lỗi API ${res.status}`);
  return res.json();
}

/** Danh sách model mà key/endpoint hiện tại dùng được, lấy từ API của nhà cung cấp. */
export async function listModels(c: LlmConfig): Promise<string[]> {
  if (c.provider === "gemini") {
    const data = await getJson("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      "x-goog-api-key": c.key,
    });
    return (data?.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""));
  }
  if (c.provider === "openai") {
    const data = await getJson(`${c.baseUrl.replace(/\/+$/, "")}/models`, c.key ? { authorization: `Bearer ${c.key}` } : {});
    return (data?.data ?? []).map((m: { id: string }) => m.id).sort();
  }
  const client = new Anthropic({ apiKey: c.key, dangerouslyAllowBrowser: true, maxRetries: 0 });
  const ids: string[] = [];
  for await (const m of client.models.list({ limit: 100 })) ids.push(m.id);
  return ids;
}

export async function generateReading(
  level: ReadingLevel,
  topic: string,
): Promise<Reading> {
  const c = getLlmConfig();
  const name = PROVIDERS.find((p) => p.value === c.provider)!.label;
  if (!c.key && c.provider !== "openai") throw new Error(`Chưa nhập API key cho ${name}.`);
  if (!c.model) throw new Error("Hãy nhập tên model.");
  if (!topic.trim()) throw new Error("Hãy nhập chủ đề.");

  const lists = await loadControlledLists(getDb(), level);
  const text = await CALL[c.provider](c, buildPrompt(level, topic.trim(), lists));
  return parseReading(text, level);
}
