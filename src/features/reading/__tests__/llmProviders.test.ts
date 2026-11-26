// @vitest-environment node
// node env vì makeTestDb dùng node:sqlite (jsdom không bundle được); tự cấp localStorage + window.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb } from "../../../db/__tests__/makeTestDb";
import { generateReading, getLlmConfig, listModels, setLlmConfig } from "../generate";

const store = new Map<string, string>();
Object.assign(globalThis, {
  window: globalThis,
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
});

const READING_JSON = JSON.stringify({
  titleJp: "{市場|いちば}",
  titleVi: "Chợ",
  sentences: [{ jp: "{市場|いちば}へ{行|い}きます。", vi: "Tôi đi chợ." }],
});

function mockFetch(body: unknown) {
  const fn = vi.fn(async (_url: unknown, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

// SDK có thể gọi fetch(Request) hoặc fetch(url, init): gom lại url/headers/body.
async function lastCall(fn: ReturnType<typeof mockFetch>) {
  const [input, init] = fn.mock.calls.at(-1)!;
  const req = new Request(input as RequestInfo, init);
  const text = await req.text();
  return { url: req.url, headers: req.headers, body: text ? JSON.parse(text) : null };
}

describe("cấu hình LLM theo nhà cung cấp", () => {
  beforeEach(() => localStorage.clear());

  it("đọc key/model Gemini đã lưu theo tên cũ", () => {
    localStorage.setItem("reading.geminiKey", "AIza-old");
    localStorage.setItem("reading.geminiModel", "gemini-2.0-flash"); // model đã ngừng → về mặc định
    expect(getLlmConfig()).toMatchObject({ provider: "gemini", key: "AIza-old", model: "gemini-3.8-flash" });
  });

  it("mỗi provider giữ key riêng, provider chọn sau cùng là mặc định", () => {
    setLlmConfig({ provider: "gemini", key: "g", model: "gm", baseUrl: "" });
    setLlmConfig({ provider: "anthropic", key: " a ", model: "", baseUrl: "" });
    expect(getLlmConfig()).toMatchObject({ provider: "anthropic", key: "a", model: "claude-opus-5-5" });
    expect(getLlmConfig("gemini")).toMatchObject({ key: "g", model: "gm" });
    expect(getLlmConfig("openai")).toMatchObject({ key: "", model: "", baseUrl: "https://api.openai.com/v1" });
  });
});

describe("gọi API theo nhà cung cấp", () => {
  beforeEach(() => {
    localStorage.clear();
    window.db = makeTestDb().q;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("OpenAI-compatible: gọi {baseUrl}/chat/completions, không gửi key khi để trống", async () => {
    setLlmConfig({ provider: "openai", key: "", model: "qwen2.5", baseUrl: "http://localhost:11434/v1/" });
    const fn = mockFetch({ choices: [{ finish_reason: "stop", message: { content: READING_JSON } }] });
    const r = await generateReading("N5", "đi chợ");
    const call = await lastCall(fn);
    expect(call.url).toBe("http://localhost:11434/v1/chat/completions");
    expect(call.headers.get("authorization")).toBeNull();
    expect(call.body.model).toBe("qwen2.5");
    expect(r.titleVi).toBe("Chợ");
  });

  it("OpenAI-compatible: bắt nhập model", async () => {
    setLlmConfig({ provider: "openai", key: "sk", model: "", baseUrl: "" });
    await expect(generateReading("N5", "đi chợ")).rejects.toThrow("Hãy nhập tên model");
  });

  it("Claude: gọi Messages API qua SDK, bật fallback cho claude-opus-5-5", async () => {
    setLlmConfig({ provider: "anthropic", key: "sk-ant-test", model: "", baseUrl: "" });
    const fn = mockFetch({
      id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5",
      content: [{ type: "text", text: READING_JSON }],
      stop_reason: "end_turn", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    const r = await generateReading("N5", "đi chợ");
    const call = await lastCall(fn);
    expect(call.url).toContain("https://api.anthropic.com/v1/messages");
    expect(call.headers.get("authorization")).toBe("Bearer sk-ant-test");
    expect(call.body).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default" });
    expect(r.titleJp).toBe("{市場|いちば}");
  });

  it("Claude: báo lỗi khi bị từ chối", async () => {
    setLlmConfig({ provider: "anthropic", key: "sk-ant-test", model: "claude-haiku-5-5", baseUrl: "" });
    const fn = mockFetch({
      id: "msg_2", type: "message", role: "assistant", model: "claude-haiku-5-5",
      content: [], stop_reason: "refusal", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 0 },
    });
    await expect(generateReading("N5", "x")).rejects.toThrow("từ chối");
    expect((await lastCall(fn)).body.fallbacks).toBeUndefined(); // model không hỗ trợ fallback
  });
});

describe("lấy danh sách model", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("Gemini: chỉ giữ model sinh được nội dung, bỏ tiền tố models/", async () => {
    const fn = mockFetch({ models: [
      { name: "models/gemini-x", supportedGenerationMethods: ["generateContent"] },
      { name: "models/embed-y", supportedGenerationMethods: ["embedContent"] },
    ] });
    expect(await listModels({ provider: "gemini", key: "k", model: "", baseUrl: "" })).toEqual(["gemini-x"]);
    expect((await lastCall(fn)).headers.get("x-goog-api-key")).toBe("k");
  });

  it("OpenAI-compatible: gọi {baseUrl}/models", async () => {
    const fn = mockFetch({ data: [{ id: "qwen2.5" }, { id: "llama3" }] });
    expect(await listModels({ provider: "openai", key: "", model: "", baseUrl: "http://localhost:11434/v1" }))
      .toEqual(["llama3", "qwen2.5"]);
    expect((await lastCall(fn)).url).toBe("http://localhost:11434/v1/models");
  });

  it("Claude: dùng models.list của SDK", async () => {
    mockFetch({ data: [{ id: "claude-opus-5-5", type: "model" }], has_more: false, first_id: "a", last_id: "a" });
    expect(await listModels({ provider: "anthropic", key: "sk", model: "", baseUrl: "" })).toEqual(["claude-opus-5-5"]);
  });
});
