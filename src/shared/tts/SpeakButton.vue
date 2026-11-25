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
    aria-label="Phát âm"
    class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-base hover:bg-accent-soft"
  >
    <span aria-hidden="true">🔊</span>
  </button>
</template>
