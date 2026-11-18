<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useStudyQueue } from "./useStudyQueue";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import FuriganaText from "../../shared/FuriganaText.vue";

const route = useRoute();
const deckId = Number(route.params.deckId);
const { current, done, loading, remaining, revealed, reveal, grade } =
  useStudyQueue(deckId);

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

const GRADES = [
  { rating: "again", label: "Again (1)", cls: "bg-rose-600 hover:bg-rose-700" },
  { rating: "hard", label: "Hard (2)", cls: "bg-amber-600 hover:bg-amber-700" },
  { rating: "good", label: "Good (3)", cls: "bg-emerald-600 hover:bg-emerald-700" },
  { rating: "easy", label: "Easy (4)", cls: "bg-sky-600 hover:bg-sky-700" },
] as const;
</script>

<template>
  <div class="mx-auto max-w-xl">
    <p v-if="loading" class="text-slate-500">Đang tải…</p>

    <div v-else-if="done" class="text-center">
      <p class="mb-4 text-lg">Xong! Hôm nay không còn thẻ 🎉</p>
      <RouterLink to="/review/vocab" class="text-indigo-600">← Về bộ thẻ</RouterLink>
    </div>

    <div v-else-if="current" class="text-center">
      <p class="mb-4 text-sm text-slate-400">Còn lại: {{ remaining }}</p>

      <div class="mb-6 rounded-lg border border-slate-200 p-8 dark:border-slate-800">
        <template v-if="current.content.direction === 'recognition'">
          <div class="flex items-center justify-center gap-3">
            <span class="text-4xl font-bold">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" />
          </div>
        </template>
        <template v-else>
          <span class="text-2xl">{{ current.content.meaning }}</span>
        </template>

        <div v-if="revealed" class="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div v-if="current.content.direction === 'production'" class="flex items-center justify-center gap-3">
            <span class="text-4xl font-bold">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" />
          </div>
          <p v-if="current.content.reading" class="mt-2 text-slate-500">
            {{ current.content.reading }}
          </p>
          <p v-if="current.content.direction === 'recognition'" class="mt-1 text-lg">
            {{ current.content.meaning }}
          </p>
          <p v-if="current.content.strokeCount" class="mt-1 text-sm text-slate-400">
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
              <p v-if="current.content.exampleEn" class="text-sm text-slate-500">
                {{ current.content.exampleEn }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="!revealed"
        type="button"
        @click="reveal"
        class="rounded bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
      >
        Hiện đáp án (Space)
      </button>
      <div v-else class="flex justify-center gap-2">
        <button
          v-for="g in GRADES"
          :key="g.rating"
          type="button"
          @click="grade(g.rating)"
          :class="['rounded px-4 py-2 text-sm text-white', g.cls]"
        >
          {{ g.label }}
        </button>
      </div>
    </div>
  </div>
</template>
