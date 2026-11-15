<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
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
    <h2 class="mb-4 text-xl font-semibold">Cài đặt</h2>

    <section class="mb-6">
      <h3 class="mb-2 font-semibold">Giao diện</h3>
      <div class="flex items-center gap-3">
        <span class="w-28 text-slate-500">Chủ đề</span>
        <div class="flex rounded border border-slate-300 dark:border-slate-700">
          <button
            v-for="t in ['light', 'dark']"
            :key="t"
            type="button"
            @click="settings.update({ theme: t as 'light' | 'dark' })"
            :class="[
              'px-3 py-1.5 text-sm',
              settings.theme === t
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            {{ t === "light" ? "Sáng" : "Tối" }}
          </button>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <span class="w-28 text-slate-500">Cỡ chữ</span>
        <div class="flex rounded border border-slate-300 dark:border-slate-700">
          <button
            v-for="f in FONT_OPTIONS"
            :key="f.value"
            type="button"
            @click="settings.update({ fontScale: f.value })"
            :class="[
              'px-3 py-1.5 text-sm',
              settings.fontScale === f.value
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
    </section>

    <section>
      <h3 class="mb-2 font-semibold">Phát âm (TTS)</h3>
      <p v-if="!supported" class="mb-2 text-sm text-amber-600">
        Máy chưa có giọng tiếng Nhật. Cài trong Windows: Settings → Time &
        language → Speech → thêm giọng tiếng Nhật.
      </p>
      <div class="flex items-center gap-3">
        <span class="w-28 text-slate-500">Giọng đọc</span>
        <select
          :value="settings.ttsVoiceURI"
          @change="
            settings.update({
              ttsVoiceURI: ($event.target as HTMLSelectElement).value,
            })
          "
          class="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Mặc định (ja-JP)</option>
          <option v-for="v in voices" :key="v.voiceURI" :value="v.voiceURI">
            {{ v.name }} ({{ v.lang }})
          </option>
        </select>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <span class="w-28 text-slate-500">Tốc độ</span>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          :value="settings.ttsRate"
          @input="
            settings.update({
              ttsRate: Number(($event.target as HTMLInputElement).value),
            })
          "
          class="flex-1"
        />
        <span class="w-10 text-right text-sm">{{
          settings.ttsRate.toFixed(1)
        }}x</span>
      </div>
      <button
        type="button"
        @click="testSpeak"
        class="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
      >
        🔊 Nghe thử
      </button>
    </section>
  </div>
</template>
