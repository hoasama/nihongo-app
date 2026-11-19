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
  { rating: "again", label: "Lại (1)", cls: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" },
  { rating: "hard", label: "Khó (2)", cls: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { rating: "good", label: "Tốt (3)", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  { rating: "easy", label: "Dễ (4)", cls: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100" },
] as const;
</script>

<template>
  <div class="mx-auto max-w-[560px]">
    <p v-if="loading" class="text-muted">Đang tải…</p>

    <div v-else-if="done" class="text-center">
      <p class="mb-4 text-lg">Xong! Hôm nay không còn thẻ 🎉</p>
      <RouterLink to="/review/vocab" class="text-accent">← Về bộ thẻ</RouterLink>
    </div>

    <div v-else-if="current" class="text-center">
      <p class="mb-4 text-sm text-muted">Còn lại: {{ remaining }}</p>

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

      <button
        v-if="!revealed"
        type="button"
        @click="reveal"
        class="btn btn-primary px-6! py-2.5!"
      >
        Hiện đáp án (Space)
      </button>
      <div v-else class="flex justify-center gap-2">
        <button
          v-for="g in GRADES"
          :key="g.rating"
          type="button"
          @click="grade(g.rating)"
          :class="['rounded-[10px] border px-5 py-2 text-sm font-medium shadow-sm', g.cls]"
        >
          {{ g.label }}
        </button>
      </div>
    </div>
  </div>
</template>
