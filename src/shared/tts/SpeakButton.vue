<script setup lang="ts">
import { useSpeak } from "./useSpeak";
import { useSettings } from "../settingsStore";

const props = defineProps<{ text: string }>();
const { speak, supported } = useSpeak();
const settings = useSettings();

function onClick() {
  speak(props.text, {
    rate: settings.ttsRate,
    voiceURI: settings.ttsVoiceURI || undefined,
  });
}
</script>

<template>
  <button
    type="button"
    @click="onClick"
    :title="
      supported
        ? 'Phát âm'
        : 'Máy chưa có giọng tiếng Nhật — cài gói giọng ja-JP trong Windows (Settings → Time & language → Speech)'
    "
    class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-base hover:bg-slate-200 dark:hover:bg-slate-700"
  >
    🔊
  </button>
</template>
