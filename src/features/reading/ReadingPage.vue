<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSpeak } from '../../shared/tts/useSpeak';
import { useSettings } from '../../shared/settingsStore';
import FuriganaText from '../../shared/FuriganaText.vue';
import LevelTag from '../../shared/LevelTag.vue';
import { READINGS, type ReadingLevel } from './readings';
import {
  generateReading,
  getLlmConfig,
  setLlmConfig,
  PROVIDERS,
  DEFAULT_BASE_URL,
  SUGGESTED_MODELS,
  listModels,
  loadGenerated,
  saveGenerated,
} from './generate';

// Markup furigana "{漢字|かな}" → chữ Hán trơn (bỏ cách đọc nhỏ) cho TTS đọc tự nhiên.
const furiganaToPlain = (t: string) =>
  t.replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1');

const settings = useSettings();
const { speak } = useSpeak();

// Giữ N2/N1 ở bộ lọc vì có bài soạn sẵn; LLM chỉ tạo bài N5–N3.
const LEVELS: ReadingLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const toOption = (v: ReadingLevel) => ({ value: v, label: v });
// Segmented như trang Tra từ; N3/N2/N1 gộp thành "N3+" cho vừa cột 320px.
type LevelFilter = 'all' | 'N5' | 'N4' | 'N3+';
const FILTER_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'N5', label: 'N5' },
  { value: 'N4', label: 'N4' },
  { value: 'N3+', label: 'N3+' },
];
const GEN_OPTIONS = LEVELS.slice(0, 3).map(toOption);
const levelFilter = ref<LevelFilter>('all');
const matchLevel = (lv: ReadingLevel, f: LevelFilter) =>
  f === 'all' || (f === 'N3+' ? !['N5', 'N4'].includes(lv) : lv === f);
const q = ref('');

// Bài do LLM sinh (lưu localStorage) đứng trước bài soạn sẵn.
const generated = ref(loadGenerated());
const allReadings = computed(() => [...generated.value, ...READINGS]);

const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase();
  return allReadings.value.filter(
    (r) =>
      matchLevel(r.level, levelFilter.value) &&
      (!kw ||
        r.titleJp.includes(q.value) ||
        r.titleVi.toLowerCase().includes(kw)),
  );
});

const selectedId = ref(READINGS[0].id);
const current = computed(
  () => allReadings.value.find((r) => r.id === selectedId.value) ?? READINGS[0],
);
const showVi = ref(true);

function stop() {
  window.speechSynthesis?.cancel();
}
function say(text: string, slow = false) {
  speak(furiganaToPlain(text), {
    rate: slow ? 0.6 : settings.ttsRate,
    voiceURI: settings.ttsVoiceURI || undefined,
  });
}
function sayAll(slow = false) {
  say(current.value.sentences.map((s) => s.jp).join(' '), slow);
}

const freeText = ref('');
function sayFree() {
  speak(freeText.value, {
    rate: settings.ttsRate,
    voiceURI: settings.ttsVoiceURI || undefined,
  });
}

// --- Tạo bài mới bằng LLM ---
const llm = ref(getLlmConfig());
// Đổi provider: lưu cấu hình đang nhập rồi nạp cấu hình đã lưu của provider mới.
watch(
  () => llm.value.provider,
  (p, prev) => {
    setLlmConfig({ ...llm.value, provider: prev });
    llm.value = getLlmConfig(p);
    setLlmConfig(llm.value); // nhớ provider vừa chọn kể cả khi chưa bấm Tạo bài
  },
);
// Danh sách model lấy từ API khi mở dropdown; lỗi/chưa có key thì dùng gợi ý sẵn.
const apiModels = ref<string[]>([]);
const modelsLoading = ref(false);
const modelsError = ref('');
const modelSearch = ref('');
let loadedFor = '';
async function loadModels(open: boolean) {
  const c = llm.value;
  const sig = `${c.provider}|${c.key}|${c.baseUrl}`;
  if (!open || sig === loadedFor || (!c.key && c.provider !== 'openai')) return;
  loadedFor = sig;
  modelsLoading.value = true;
  modelsError.value = '';
  try {
    apiModels.value = await listModels(c);
  } catch (e) {
    apiModels.value = [];
    modelsError.value = `Không lấy được danh sách model (${e instanceof Error ? e.message : e}). Có thể gõ tên model vào ô.`;
    loadedFor = ''; // cho thử lại lần mở sau
  } finally {
    modelsLoading.value = false;
  }
}
watch(
  () => llm.value.provider,
  () => {
    apiModels.value = [];
    modelsError.value = '';
    loadedFor = '';
  },
);
// Base URL hay dùng; vẫn gõ được địa chỉ khác (giống ô Model).
const BASE_URLS = [
  ['OpenAI', DEFAULT_BASE_URL],
  ['OpenRouter', 'https://openrouter.ai/api/v1'],
  ['DeepSeek', 'https://api.deepseek.com/v1'],
  ['Groq', 'https://api.groq.com/openai/v1'],
  ['Ollama (trên máy)', 'http://localhost:11434/v1'],
  ['LM Studio (trên máy)', 'http://localhost:1234/v1'],
];
const baseUrlSearch = ref('');
const baseUrlOptions = computed(() => {
  const known = new Map(BASE_URLS.map(([name, url]) => [url, `${name} — ${url}`]));
  return [...new Set([baseUrlSearch.value.trim(), llm.value.baseUrl, ...known.keys()])]
    .filter(Boolean)
    .map((url) => ({ value: url, label: known.get(url) ?? url }));
});
// Luôn giữ model đang chọn và chữ đang gõ trong danh sách để vẫn dùng được model ngoài danh sách.
const modelOptions = computed(() =>
  [
    ...new Set([
      modelSearch.value.trim(),
      llm.value.model,
      ...(apiModels.value.length ? apiModels.value : SUGGESTED_MODELS[llm.value.provider]),
    ]),
  ]
    .filter(Boolean)
    .map((m) => ({ value: m, label: m })),
);
const KEY_HINT: Record<string, { placeholder: string; help: string }> = {
  gemini: { placeholder: 'AIza…', help: 'Gemini có gói miễn phí.' },
  openai: {
    placeholder: 'sk-… (để trống nếu dùng Ollama / LM Studio)',
    help: 'Ollama cần bật CORS: đặt biến môi trường OLLAMA_ORIGINS=* rồi khởi động lại Ollama.',
  },
  anthropic: { placeholder: 'sk-ant-…', help: '' },
};
// Trang tạo API key: theo provider, riêng OpenAI-compatible thì theo Base URL đang chọn.
const KEY_PAGES: Record<string, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  anthropic: 'https://platform.claude.com/settings/keys',
  [DEFAULT_BASE_URL]: 'https://platform.openai.com/api-keys',
  'https://openrouter.ai/api/v1': 'https://openrouter.ai/keys',
  'https://api.deepseek.com/v1': 'https://platform.deepseek.com/api_keys',
  'https://api.groq.com/openai/v1': 'https://console.groq.com/keys',
};
const keyPage = computed(() =>
  KEY_PAGES[llm.value.provider === 'openai' ? llm.value.baseUrl.replace(/\/+$/, '') : llm.value.provider],
);
const genLevel = ref<ReadingLevel>('N5');
const topic = ref('');
const genLoading = ref(false);
const genError = ref('');
const genOpen = ref(false);
const freeOpen = ref(false);

async function generate() {
  if (genLoading.value) return; // Enter vẫn gọi được khi nút đã disabled
  genError.value = '';
  setLlmConfig(llm.value);
  genLoading.value = true;
  try {
    const r = await generateReading(genLevel.value, topic.value);
    generated.value = [r, ...generated.value];
    saveGenerated(generated.value);
    selectedId.value = r.id;
    topic.value = '';
    genOpen.value = false;
  } catch (e) {
    genOpen.value = true; // người dùng có thể đã đóng modal khi đang chờ, vẫn phải thấy lỗi
    genError.value =
      e instanceof DOMException && e.name === "TimeoutError"
        ? "LLM không phản hồi sau 90 giây. Hãy thử lại hoặc đổi model."
        : e instanceof Error
          ? e.message
          : String(e);
  } finally {
    genLoading.value = false;
  }
}

function deleteCurrent() {
  if (!current.value.id.startsWith('gen-')) return;
  generated.value = generated.value.filter((r) => r.id !== current.value.id);
  saveGenerated(generated.value);
  selectedId.value = allReadings.value[0]?.id ?? READINGS[0].id;
}
</script>

<template>
  <div class="flex flex-col lg:h-full">
    <header class="mb-4 flex shrink-0 flex-wrap items-center gap-2">
      <h2 class="mr-auto text-2xl font-bold">Luyện đọc</h2>
      <a-button @click="freeOpen = true">Nhập văn bản</a-button>
      <a-button type="primary" :loading="genLoading" @click="genOpen = true">
        ✨ Tạo bài
      </a-button>
    </header>

    <div class="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_1fr]">
      <!-- Cột trái: danh sách bài đọc -->
      <div class="n-card flex max-h-72 min-h-0 flex-col p-1.5 lg:max-h-none">
        <div class="mb-1.5 flex shrink-0 flex-col gap-2 p-1">
          <a-input v-model:value="q" allow-clear placeholder="Tìm bài đọc…" aria-label="Tìm bài đọc" />
          <a-segmented v-model:value="levelFilter" :options="FILTER_OPTIONS" block />
        </div>
        <ul class="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          <li v-if="filtered.length === 0" class="p-6 text-center text-sm text-muted">
            Không có bài nào.
          </li>
          <li v-for="r in filtered" :key="r.id">
            <button
              type="button"
              :class="[
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                r.id === selectedId ? 'bg-accent-soft' : 'hover:bg-accent-soft/60',
              ]"
              @click="((selectedId = r.id), stop())"
            >
              <span class="min-w-0">
                <!-- tiêu đề bài LLM có markup furigana: bỏ cách đọc cho dòng tiêu đề 1 dòng -->
                <span class="jp block truncate text-lg font-semibold">{{ furiganaToPlain(r.titleJp) }}</span>
                <span class="block truncate text-sm text-muted">{{ r.titleVi }}</span>
              </span>
              <LevelTag :level="r.level" class="ml-auto shrink-0" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Cột phải: bài đọc -->
      <div class="n-card p-7 lg:overflow-y-auto">
        <LevelTag :level="current.level" />
        <h3 class="jp mt-2 text-3xl font-bold"><FuriganaText :text="current.titleJp" /></h3>
        <p class="mb-4 text-muted">{{ current.titleVi }}</p>

        <div class="mb-3 flex flex-wrap items-center gap-2">
          <a-button type="primary" @click="sayAll(false)">▶ Đọc cả bài</a-button>
          <a-button @click="sayAll(true)">🐢 Đọc chậm</a-button>
          <a-button @click="stop">■ Dừng</a-button>
          <a-checkbox v-model:checked="showVi" class="ml-1">Hiện bản dịch</a-checkbox>
          <a-button
            v-if="current.id.startsWith('gen-')"
            danger
            class="ml-auto"
            @click="deleteCurrent"
          >
            🗑 Xoá bài này
          </a-button>
        </div>
        <p class="mb-4 text-sm text-muted">
          Bấm vào từng câu để nghe riêng câu đó.
        </p>

        <p class="jp text-2xl leading-[2.4]">
          <span
            v-for="(s, i) in current.sentences"
            :key="i"
            role="button"
            tabindex="0"
            :aria-label="`Nghe câu: ${furiganaToPlain(s.jp)}`"
            class="cursor-pointer rounded px-0.5 hover:bg-accent-soft focus-visible:bg-accent-soft"
            @click="say(s.jp)"
            @keydown.enter.prevent="say(s.jp)"
            @keydown.space.prevent="say(s.jp)"
          >
            <FuriganaText :text="s.jp" />
          </span>
        </p>

        <div v-if="showVi" class="mt-5 space-y-3 border-t border-line pt-4">
          <div v-for="(s, i) in current.sentences" :key="i">
            <p>{{ s.vi }}</p>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="genOpen" title="Tạo bài mới (Nguồn LLM)" :footer="null">
      <p class="mb-3 text-sm text-muted">
        AI tự viết bài theo chủ đề, đúng trình độ, phong cách NHK News
        Web Easy. Furigana tự động.
      </p>

      <label class="mb-1 block text-sm text-muted">Trình độ</label>
      <a-select
        v-model:value="genLevel"
        :options="GEN_OPTIONS"
        class="mb-3 w-full"
      />

      <label class="mb-1 block text-sm text-muted">Chủ đề</label>
      <a-input
        v-model:value="topic"
        class="mb-3"
        aria-label="Chủ đề"
        placeholder="VD: đi chợ, lễ hội mùa hè, tái chế rác…"
        @press-enter="generate"
      />

      <a-button type="primary" block class="mb-3" :loading="genLoading" @click="generate">
        {{ genLoading ? 'Đang tạo…' : '✨ Tạo bài' }}
      </a-button>
      <p v-if="genError" class="mt-2 text-sm text-red-600">
        {{ genError }}
      </p>

      <details class="mt-4 text-sm">
        <summary class="cursor-pointer text-muted">Cài đặt LLM</summary>
        <label class="mb-1 mt-2 block text-muted">Nhà cung cấp</label>
        <a-select
          v-model:value="llm.provider"
          :options="PROVIDERS"
          aria-label="Nhà cung cấp LLM"
          class="w-full"
        />
        <template v-if="llm.provider === 'openai'">
          <label class="mb-1 mt-2 block text-muted">Base URL</label>
          <a-select
            v-model:value="llm.baseUrl"
            show-search
            option-filter-prop="label"
            :options="baseUrlOptions"
            aria-label="Base URL"
            class="w-full"
            placeholder="Chọn dịch vụ hoặc gõ địa chỉ"
            @search="(v: string) => (baseUrlSearch = v)"
            @select="baseUrlSearch = ''"
          />
        </template>
        <div class="mb-1 mt-2 flex items-baseline justify-between">
          <label class="text-muted">API key</label>
          <a v-if="keyPage" :href="keyPage" target="_blank" rel="noopener noreferrer" class="text-xs">
            Lấy key ở đây ↗
          </a>
        </div>
        <a-input-password
          v-model:value="llm.key"
          aria-label="API key"
          autocomplete="off"
          :spellcheck="false"
          :placeholder="KEY_HINT[llm.provider].placeholder"
        />
        <label class="mb-1 mt-2 block text-muted">Model</label>
        <a-select
          v-model:value="llm.model"
          @search="(v: string) => (modelSearch = v)"
          show-search
          :options="modelOptions"
          :loading="modelsLoading"
          aria-label="Model"
          class="w-full"
          placeholder="Chọn hoặc gõ tên model"
          @open-change="loadModels"
          @select="modelSearch = ''"
        />
        <p v-if="modelsError" class="mt-1 text-xs text-red-500">{{ modelsError }}</p>
        <p class="mt-1 text-xs text-muted">
          {{ KEY_HINT[llm.provider].help }} Key lưu cục bộ trong máy (localStorage),
          chỉ gửi tới nhà cung cấp đã chọn.
        </p>
      </details>
    </a-modal>

    <a-modal
      v-model:open="freeOpen"
      title="Tự nhập văn bản để nghe đọc"
      :footer="null"
      @cancel="stop"
    >
      <a-textarea
        v-model:value="freeText"
        :rows="6"
        aria-label="Văn bản tiếng Nhật"
        placeholder="Dán đoạn văn tiếng Nhật vào đây, ví dụ: 今日はいい天気ですね。散歩に行きましょう。"
      />
      <div class="mt-3 flex gap-2">
        <a-button type="primary" @click="sayFree">▶ Đọc</a-button>
        <a-button @click="stop">■ Dừng</a-button>
      </div>
    </a-modal>
  </div>
</template>
