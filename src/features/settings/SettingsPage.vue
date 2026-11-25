<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useSettings } from "../../shared/settingsStore";
import { useSpeak } from "../../shared/tts/useSpeak";
import FuriganaText from "../../shared/FuriganaText.vue";

const settings = useSettings();
const { speak, supported } = useSpeak();
const voices = ref<SpeechSynthesisVoice[]>([]);

const FONT_OPTIONS = [
  { label: "小 Nhỏ", value: 1 },
  { label: "中 Vừa", value: 1.1 },
  { label: "大 Lớn", value: 1.25 },
];
const THEME_OPTIONS = [
  { label: "☀ Sáng", value: "light" },
  { label: "☾ Tối", value: "dark" },
];

const voiceOptions = computed(() => [
  { label: "Mặc định (ja-JP)", value: "" },
  ...voices.value.map((v) => ({ label: `${v.name} (${v.lang})`, value: v.voiceURI })),
]);

// Câu ví dụ cho khung Xem trước — phản ứng theo cỡ chữ + furigana đang chọn.
const PREVIEW = {
  jp: "{毎朝|まいあさ}、{駅|えき}の{売店|ばいてん}で{新聞|しんぶん}を{買|か}います。",
  plain: "毎朝、駅の売店で新聞を買います。",
  vi: "Mỗi sáng tôi mua báo ở quầy hàng trong nhà ga.",
};

const voiceName = computed(() => {
  if (!settings.ttsVoiceURI) return "mặc định";
  const v = voices.value.find((x) => x.voiceURI === settings.ttsVoiceURI);
  return v ? v.name.replace(/^Microsoft /, "") : "mặc định";
});

let synth: SpeechSynthesis | undefined;
const loadVoices = () => {
  if (synth)
    voices.value = synth
      .getVoices()
      .filter((v) => v.lang?.toLowerCase().startsWith("ja"));
};
onMounted(() => {
  synth = window.speechSynthesis;
  if (!synth) return;
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);
});
onUnmounted(() => synth?.removeEventListener?.("voiceschanged", loadVoices));

function testSpeak() {
  speak(PREVIEW.plain, {
    rate: settings.ttsRate,
    voiceURI: settings.ttsVoiceURI || undefined,
  });
}
</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row">
    <!-- Cột cài đặt -->
    <div class="min-w-0 flex-1">
      <header class="mb-6">
        <h2 class="text-2xl font-bold">Cài đặt</h2>
        <p class="mt-1 text-muted">Thay đổi được áp dụng ngay và tự lưu.</p>
      </header>

      <section>
        <h3 class="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Hiển thị
        </h3>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Chủ đề</div>
          </div>
          <a-segmented
            aria-label="Chủ đề giao diện"
            :value="settings.theme"
            :options="THEME_OPTIONS"
            @change="settings.update({ theme: $event as 'light' | 'dark' })"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Cỡ chữ tiếng Nhật</div>
            <p class="mt-0.5 text-sm text-muted">Áp dụng cho câu ví dụ và bài đọc.</p>
          </div>
          <a-segmented
            aria-label="Cỡ chữ tiếng Nhật"
            :value="settings.fontScale"
            :options="FONT_OPTIONS"
            @change="settings.update({ fontScale: $event as number })"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Furigana</div>
            <p class="mt-0.5 text-sm text-muted">Hiện cách đọc nhỏ phía trên chữ Hán.</p>
          </div>
          <a-switch
            aria-label="Hiện furigana"
            :checked="settings.showFurigana"
            @change="settings.update({ showFurigana: $event as boolean })"
          />
        </div>
      </section>

      <section class="mt-8">
        <h3 class="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Phát âm
        </h3>
        <p v-if="!supported" class="mb-2 text-sm text-amber-600">
          Máy chưa có giọng tiếng Nhật. Cài trong Windows: Settings → Time &
          language → Speech → thêm giọng tiếng Nhật.
        </p>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Giọng đọc</div>
            <p class="mt-0.5 text-sm text-muted">Lấy từ các giọng tiếng Nhật cài trên máy.</p>
          </div>
          <a-select
            aria-label="Giọng đọc"
            class="w-60 shrink-0"
            :value="settings.ttsVoiceURI"
            :options="voiceOptions"
            @change="settings.update({ ttsVoiceURI: $event as string })"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Tốc độ đọc</div>
            <p class="mt-0.5 text-sm text-muted">Mới học nên để chậm hơn 1.0x.</p>
          </div>
          <div class="w-60 shrink-0">
            <div class="flex items-center gap-3">
              <a-slider
                class="flex-1"
                aria-label="Tốc độ đọc"
                :min="0.5"
                :max="1.5"
                :step="0.1"
                :value="settings.ttsRate"
                @change="settings.update({ ttsRate: $event as number })"
              />
              <span class="w-10 text-right text-sm tabular-nums"
                >{{ settings.ttsRate.toFixed(1) }}x</span
              >
            </div>
            <div class="flex justify-between text-xs text-muted">
              <span>Chậm</span><span>Nhanh</span>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-8">
        <h3 class="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Ôn tập
        </h3>
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <div class="min-w-0 flex-1 basis-56">
            <div class="font-medium">Thẻ mới mỗi ngày</div>
            <p class="mt-0.5 text-sm text-muted">
              Học nhiều thẻ mới thì những ngày sau cũng có nhiều thẻ cần ôn hơn.
            </p>
          </div>
          <a-input-number
            aria-label="Số thẻ mới mỗi ngày"
            :min="0"
            :max="100"
            :value="settings.srsNewPerDay"
            @change="settings.update({ srsNewPerDay: Math.max(0, Number($event) || 0) })"
          />
        </div>
      </section>
    </div>

    <!-- Khung xem trước -->
    <aside class="n-card h-fit w-full p-6 lg:sticky lg:top-6 lg:w-80 lg:shrink-0">
      <h3 class="font-semibold">Xem trước</h3>
      <p class="mt-0.5 text-sm text-muted">Câu ví dụ hiển thị theo cài đặt của bạn.</p>

      <p class="jp mt-4 text-3xl leading-[2.1]">
        <FuriganaText :text="PREVIEW.jp" />
      </p>
      <p class="mt-3 border-t border-line pt-3 text-sm text-muted">{{ PREVIEW.vi }}</p>

      <a-button type="primary" class="mt-4" @click="testSpeak">🔊 Nghe thử</a-button>
      <p class="mt-2 text-xs text-muted">
        Giọng {{ voiceName }}, tốc độ {{ settings.ttsRate.toFixed(1) }}x
      </p>
    </aside>
  </div>
</template>
