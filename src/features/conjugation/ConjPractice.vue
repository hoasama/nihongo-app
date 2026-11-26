<script setup lang="ts">
// Luyện chia thể: cho một từ cùng cấp + một thể, người học gõ dạng đã chia (kana, kanji hoặc romaji).
import { computed, nextTick, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getDb } from "../../db/client";
import { listConjugatableWords } from "../../db/words.repo";
import type { ConjKind, ConjLevel } from "../dictionary/conjugate";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import { isCorrect, pickQuestion, practicePool, type Question } from "./practice";

const props = defineProps<{ kind: ConjKind; formIds: string[]; defaultLevel: ConjLevel }>();

const LEVELS = ["N5", "N4", "N3"].map((v) => ({ value: v, label: `Từ ${v}` }));
const level = ref<ConjLevel>(props.defaultLevel);
watch(() => props.defaultLevel, (v) => (level.value = v));

const { data: words, isLoading } = useQuery({
  queryKey: ["conj-pool", level, () => props.kind],
  queryFn: () => listConjugatableWords(getDb(), level.value, props.kind),
});
const pool = computed(() => practicePool(words.value ?? [], props.kind));

const q = ref<Question | null>(null);
const answer = ref("");
const result = ref<boolean | null>(null);
const score = ref({ right: 0, total: 0 });
const inputEl = ref<{ focus: () => void } | null>(null);

function next() {
  q.value = pickQuestion(pool.value, props.kind, props.formIds);
  answer.value = "";
  result.value = null;
  nextTick(() => inputEl.value?.focus());
}
// Đổi cấp, loại từ hoặc tập thể → câu mới, điểm về 0.
watch(
  [pool, () => props.formIds.join()],
  () => {
    score.value = { right: 0, total: 0 };
    next();
  },
  { immediate: true },
);

function submit() {
  if (!q.value) return;
  if (result.value !== null) return next(); // Enter lần 2 = câu tiếp
  if (!answer.value.trim()) return;
  result.value = isCorrect(answer.value, q.value.form);
  score.value = { right: score.value.right + (result.value ? 1 : 0), total: score.value.total + 1 };
}
</script>

<template>
  <div class="rounded-xl border border-line p-4">
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Luyện tập</h3>
      <a-select v-model:value="level" :options="LEVELS" class="w-28" size="small" />
      <span class="ml-auto text-sm tabular-nums text-muted">
        Đúng {{ score.right }}/{{ score.total }}
      </span>
    </div>

    <p v-if="isLoading" class="text-muted">Đang tải…</p>
    <p v-else-if="!q" class="text-muted">Không có từ phù hợp ở cấp này.</p>
    <div v-else class="flex flex-col gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="jp text-3xl font-bold">{{ q.base.w }}</span>
          <span v-if="q.base.w !== q.base.k" class="jp text-muted">{{ q.base.k }}</span>
          <SpeakButton :text="q.base.k" />
        </div>
        <p v-if="q.word.gloss" class="text-sm text-muted">{{ q.word.gloss }}</p>
        <p class="mt-2">
          Chia sang <span class="font-semibold text-accent">{{ q.form.name }}</span>
        </p>
      </div>

      <div class="flex gap-2">
        <a-input
          ref="inputEl"
          v-model:value="answer"
          :readonly="result !== null"
          placeholder="Gõ kana, kanji hoặc romaji (vd: kaite)…"
          aria-label="Câu trả lời"
          class="jp"
          @press-enter="submit"
        />
        <a-button v-if="result === null" type="primary" @click="submit">Kiểm tra</a-button>
        <a-button v-else type="primary" @click="next">Câu tiếp</a-button>
      </div>

      <div
        v-if="result !== null"
        :class="['flex items-center gap-2 rounded-lg px-3 py-2', result ? 'bg-accent-soft' : 'bg-red-50 dark:bg-red-500/10']"
      >
        <span :class="result ? 'text-accent' : 'text-red-600'">{{ result ? "✓ Đúng" : "✗ Chưa đúng" }}</span>
        <span class="jp text-lg">{{ q.form.w }}</span>
        <span v-if="q.form.w !== q.form.k" class="jp text-muted">{{ q.form.k }}</span>
        <SpeakButton :text="q.form.k" />
        <span class="ml-auto text-xs text-muted">Enter để sang câu tiếp</span>
      </div>
    </div>
  </div>
</template>
