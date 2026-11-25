<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useStudyQueue } from "./useStudyQueue";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import FuriganaText from "../../shared/FuriganaText.vue";
import { useSpeak } from "../../shared/tts/useSpeak";
import { useSettings } from "../../shared/settingsStore";

const route = useRoute();
const deckId = Number(route.params.deckId);
const { current, done, loading, remaining, revealed, reveal, grade } =
  useStudyQueue(deckId);

const { speak } = useSpeak();
const settings = useSettings();

// Khi lật thẻ, đọc từ tiếng Nhật luôn
watch(revealed, (on) => {
  if (on && current.value?.content.japanese)
    speak(current.value.content.japanese, {
      rate: settings.ttsRate,
      voiceURI: settings.ttsVoiceURI || undefined,
    });
});

function onKey(e: KeyboardEvent) {
  if (done.value || loading.value) return;
  if (!revealed.value && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    reveal();
    return;
  }
  if (revealed.value) {
    const map: Record<string, "again" | "hard" | "good" | "easy"> = {
      "1": "again",
      "2": "hard",
      "3": "good",
      "4": "easy",
    };
    if (map[e.key]) void grade(map[e.key]);
  }
}
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

// Pastel của palette, chữ đậm; giống nhau ở light và dark (như badge cấp JLPT).
const GRADES = [
  { rating: "again", label: "Lại (1)", cls: "bg-[#ffc8dd] text-[#6b1f3d] hover:bg-[#ffb3cf]" },
  { rating: "hard", label: "Khó (2)", cls: "bg-[#ffd9b8] text-[#6b3a12] hover:bg-[#ffcb9e]" },
  { rating: "good", label: "Tốt (3)", cls: "bg-[#c6edea] text-[#0c6170] hover:bg-[#b4e6e2]" },
  { rating: "easy", label: "Dễ (4)", cls: "bg-[#cdb4db] text-[#3f2a52] hover:bg-[#c1a3d2]" },
] as const;
</script>

<template>
  <div class="mx-auto max-w-[560px]">
    <p v-if="loading" class="text-muted">Đang tải…</p>

    <div v-else-if="done" class="text-center">
      <p class="mb-4 text-lg">Xong! Hôm nay không còn thẻ 🎉</p>
      <RouterLink to="/review" class="text-accent">← Về bộ thẻ</RouterLink>
    </div>

    <div v-else-if="current" class="text-center">
      <p class="mb-4 text-sm text-muted tabular-nums">Còn lại: {{ remaining }}</p>

      <div
        class="flash-card mb-6"
        :class="{ 'cursor-pointer': !revealed }"
        @click="!revealed && reveal()"
      >
        <template v-if="current.content.direction === 'recognition'">
          <div class="flex items-center justify-center gap-3">
            <span class="jp-big">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" @click.stop />
          </div>
        </template>
        <template v-else>
          <span class="jp text-3xl font-semibold">{{ current.content.meaning }}</span>
        </template>

        <div v-if="revealed" class="mt-6 border-t border-line pt-4">
          <div v-if="current.content.direction === 'production'" class="flex items-center justify-center gap-3">
            <span class="jp-big">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" />
          </div>
          <p v-if="current.content.reading" class="jp mt-2 text-xl text-accent">
            {{ current.content.reading }}
          </p>
          <p v-if="current.content.direction === 'recognition'" class="mt-1 text-lg">
            {{ current.content.meaning }}
          </p>
          <p v-if="current.content.strokeCount" class="mt-1 text-sm text-muted">
            {{ current.content.strokeCount }} nét
          </p>
          <div v-if="current.content.exampleJp" class="mt-4 flex items-start justify-center gap-2 text-left">
            <SpeakButton :text="current.content.exampleJp" />
            <div>
              <p>
                <FuriganaText
                  v-if="current.content.exampleFurigana"
                  :text="current.content.exampleFurigana"
                />
                <template v-else>{{ current.content.exampleJp }}</template>
              </p>
              <p v-if="current.content.exampleEn" class="text-sm text-muted">
                {{ current.content.exampleEn }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <a-button v-if="!revealed" type="primary" size="large" @click="reveal">
        Hiện đáp án (Space)
      </a-button>
      <div v-else class="flex justify-center gap-2">
        <button
          v-for="g in GRADES"
          :key="g.rating"
          type="button"
          @click="grade(g.rating)"
          :class="['rounded-xl px-5 py-2 text-sm font-medium transition-colors', g.cls]"
        >
          {{ g.label }}
        </button>
      </div>
    </div>
  </div>
</template>
