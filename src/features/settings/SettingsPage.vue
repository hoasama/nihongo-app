<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useSettings } from "../../shared/settingsStore";
import { useSpeak } from "../../shared/tts/useSpeak";

const settings = useSettings();
const { speak, supported } = useSpeak();
const voices = ref<SpeechSynthesisVoice[]>([]);

const FONT_OPTIONS = [
  { label: "Nhỏ", value: 1 },
  { label: "Vừa", value: 1.1 },
  { label: "Lớn", value: 1.25 },
];
const THEME_OPTIONS = [
  { label: "Sáng", value: "light" },
  { label: "Tối", value: "dark" },
];

const voiceOptions = computed(() => [
  { label: "Mặc định (ja-JP)", value: "" },
  ...voices.value.map((v) => ({ label: `${v.name} (${v.lang})`, value: v.voiceURI })),
]);

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
  speak("こんにちは、日本語を勉強しましょう。", {
    rate: settings.ttsRate,
    voiceURI: settings.ttsVoiceURI || undefined,
  });
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h2 class="mb-4 text-2xl font-bold">Cài đặt</h2>

    <section class="mb-6">
      <h3 class="mb-2 font-semibold">Giao diện</h3>
      <div class="flex items-center gap-3">
        <span class="w-28 text-muted">Chủ đề</span>
        <a-segmented
          :value="settings.theme"
          :options="THEME_OPTIONS"
          @change="settings.update({ theme: $event as 'light' | 'dark' })"
        />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <span class="w-28 text-muted">Cỡ chữ</span>
        <a-segmented
          :value="settings.fontScale"
          :options="FONT_OPTIONS"
          @change="settings.update({ fontScale: $event as number })"
        />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <span class="w-28 text-muted">Furigana</span>
        <a-switch
          :checked="settings.showFurigana"
          @change="settings.update({ showFurigana: $event as boolean })"
        />
        <span class="text-sm text-muted"
          >Hiện cách đọc nhỏ trên chữ Hán ở câu ví dụ</span
        >
      </div>
    </section>

    <section>
      <h3 class="mb-2 font-semibold">Phát âm (TTS)</h3>
      <p v-if="!supported" class="mb-2 text-sm text-amber-600">
        Máy chưa có giọng tiếng Nhật. Cài trong Windows: Settings → Time &
        language → Speech → thêm giọng tiếng Nhật.
      </p>
      <div class="flex items-center gap-3">
        <span class="w-28 text-muted">Giọng đọc</span>
        <a-select
          :value="settings.ttsVoiceURI"
          :options="voiceOptions"
          style="flex: 1"
          @change="settings.update({ ttsVoiceURI: $event as string })"
        />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <span class="w-28 text-muted">Tốc độ</span>
        <a-slider
          class="flex-1"
          :min="0.5"
          :max="1.5"
          :step="0.1"
          :value="settings.ttsRate"
          @change="settings.update({ ttsRate: $event as number })"
        />
        <span class="w-10 text-right text-sm">{{
          settings.ttsRate.toFixed(1)
        }}x</span>
      </div>
      <a-button type="primary" class="mt-3" @click="testSpeak">
        🔊 Nghe thử
      </a-button>
    </section>

    <section class="mt-6">
      <h3 class="mb-2 font-semibold">Ôn tập (SRS)</h3>
      <div class="flex items-center gap-3">
        <span class="w-28 text-muted">Thẻ mới/ngày</span>
        <a-input-number
          :min="0"
          :max="100"
          :value="settings.srsNewPerDay"
          @change="settings.update({ srsNewPerDay: Math.max(0, Number($event) || 0) })"
        />
      </div>
    </section>
  </div>
</template>
