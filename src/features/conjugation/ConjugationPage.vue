<script setup lang="ts">
// Học chia thể theo cấp: cột trái là các thể (nhóm N5 → N3), cột phải là quy tắc + ví dụ + luyện tập.
// Trạng thái nằm trên URL (?kind=verb&form=te) để bảng chia ở Tra từ link sang được.
import { computed, ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { getDb } from "../../db/client";
import { listGrammarByTitles } from "../../db/grammar.repo";
import { ADJ_FORMS, VERB_FORMS, conjugate, type ConjKind, type ConjLevel } from "../dictionary/conjugate";
import LevelTag from "../../shared/LevelTag.vue";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import ConjPractice from "./ConjPractice.vue";
import { EXAMPLES, RULE_LABEL, infoOf } from "./formInfo";

const LEVELS: ConjLevel[] = ["N5", "N4", "N3"];
const KINDS = [
  { value: "verb", label: "Động từ" },
  { value: "adj", label: "Tính từ い / な" },
];

const route = useRoute();
const router = useRouter();
const kind = computed<ConjKind>(() => (route.query.kind === "adj" ? "adj" : "verb"));
const formId = computed(() => (typeof route.query.form === "string" ? route.query.form : "mix"));
const go = (k: ConjKind, f: string) => router.replace({ query: { kind: k, form: f } });

const forms = computed(() =>
  (kind.value === "verb" ? VERB_FORMS : ADJ_FORMS).map(([id, name, level]) => ({ id, name, level: level as ConjLevel })),
);
const groups = computed(() =>
  LEVELS.map((lv) => ({ level: lv, items: forms.value.filter((f) => f.level === lv) })).filter((g) => g.items.length),
);
const current = computed(() => forms.value.find((f) => f.id === formId.value) ?? null);
const info = computed(() => (current.value ? infoOf(kind.value, current.value.id) : undefined));

// Ví dụ minh hoạ: chia các từ mẫu sang thể đang chọn, gom theo nhóm quy tắc.
const examples = computed(() => {
  const id = current.value?.id;
  if (!id) return {};
  const out: Record<string, { base: string; w: string; k: string }[]> = {};
  for (const [w, k, pos, group] of EXAMPLES[kind.value]) {
    const t = conjugate(w, k, [pos]);
    const f = t?.forms.find((x) => x.id === id);
    if (t && f) (out[group] ??= []).push({ base: w, w: f.w, k: f.k });
  }
  return out;
});

const { data: grammar } = useQuery({
  queryKey: ["conj-grammar", kind, formId],
  queryFn: () => listGrammarByTitles(getDb(), info.value?.grammar ?? []),
});

// Luyện tổng hợp: mọi thể từ N5 đến cấp chọn.
const mixLevel = ref<ConjLevel>("N5");
const mixFormIds = computed(() =>
  forms.value.filter((f) => LEVELS.indexOf(f.level) <= LEVELS.indexOf(mixLevel.value)).map((f) => f.id),
);
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="mb-4 shrink-0">
      <h2 class="mb-3 text-2xl font-bold">Chia thể</h2>
      <a-segmented :value="kind" :options="KINDS" @change="(v: ConjKind) => go(v, 'mix')" />
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-4">
      <!-- Cột trái: các thể theo cấp -->
      <nav class="n-card flex flex-col gap-1 overflow-y-auto p-1.5">
        <button
          type="button"
          :class="[
            'flex w-full shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold transition-colors',
            formId === 'mix' ? 'bg-accent-soft' : 'hover:bg-accent-soft/60',
          ]"
          @click="go(kind, 'mix')"
        >
          ✍️ Luyện tổng hợp
        </button>
        <template v-for="g in groups" :key="g.level">
          <div class="flex shrink-0 items-center gap-2 px-3 pb-1 pt-3">
            <LevelTag :level="g.level" />
            <span class="text-xs text-muted">{{ g.items.length }} thể</span>
          </div>
          <button
            v-for="f in g.items"
            :key="f.id"
            type="button"
            :class="[
              'block w-full shrink-0 rounded-lg px-3 py-2 text-left transition-colors',
              formId === f.id ? 'bg-accent-soft' : 'hover:bg-accent-soft/60',
            ]"
            @click="go(kind, f.id)"
          >
            {{ f.name }}
          </button>
        </template>
      </nav>

      <!-- Cột phải -->
      <div class="n-card overflow-y-auto p-7">
        <template v-if="current && info">
          <div class="flex items-center gap-3">
            <h2 class="jp text-3xl font-bold">{{ current.name }}</h2>
            <LevelTag :level="current.level" class="ml-auto" />
          </div>
          <p class="mt-3 text-lg">{{ info.use }}</p>

          <h3 class="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Cách chia</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="(rule, group) in info.rules" :key="group" class="border-b border-line align-top">
                <td class="w-28 py-2 pr-3 font-semibold">{{ RULE_LABEL[group] }}</td>
                <td class="py-2 pr-3">{{ rule }}</td>
                <td class="py-2">
                  <div v-for="ex in examples[group] ?? []" :key="ex.base" class="jp flex items-center gap-1 whitespace-nowrap">
                    <span class="text-muted">{{ ex.base }} →</span>
                    <span class="text-base">{{ ex.w }}</span>
                    <SpeakButton :text="ex.k" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="info.note"
            class="mt-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-2 text-sm dark:bg-amber-500/10"
          >
            {{ info.note }}
          </p>

          <template v-if="grammar?.length">
            <h3 class="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Mẫu ngữ pháp dùng thể này</h3>
            <div class="flex flex-wrap gap-2">
              <RouterLink
                v-for="g in grammar"
                :key="g.id"
                :to="`/grammar/${g.id}`"
                class="jp rounded-lg border border-line px-3 py-1 hover:border-accent"
              >
                {{ g.title }} <span class="text-xs text-muted">{{ g.jlpt_level }}</span>
              </RouterLink>
            </div>
          </template>

          <!-- Thể từ điển / thể thường của tính từ い chính là đề bài nên không có bài luyện riêng -->
          <div v-if="current.id !== 'dict' && current.id !== 'plain'" class="mt-6">
            <ConjPractice :kind="kind" :form-ids="[current.id]" :default-level="current.level" />
          </div>
        </template>

        <template v-else>
          <h2 class="text-3xl font-bold">Luyện tổng hợp</h2>
          <p class="mt-2 text-muted">
            Ngẫu nhiên một {{ kind === "verb" ? "động từ" : "tính từ" }} và một thể đã học. Chọn phạm vi thể:
          </p>
          <a-segmented
            v-model:value="mixLevel"
            class="mt-3"
            :options="[
              { value: 'N5', label: 'Thể N5' },
              { value: 'N4', label: 'Đến N4' },
              { value: 'N3', label: 'Đến N3' },
            ]"
          />
          <div class="mt-4">
            <ConjPractice :kind="kind" :form-ids="mixFormIds" :default-level="mixLevel" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
