<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getDb } from "../../db/client";
import { listGrammar, getGrammarDetail } from "../../db/grammar.repo";
import type { GrammarSummary } from "../../shared/types";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";
import FuriganaText from "../../shared/FuriganaText.vue";

const LEVELS = ["N5", "N4"];
const level = ref("N5");
const query = ref("");
const selectedId = ref<number | null>(null);

const { data: all } = useQuery({
  queryKey: ["grammar", level],
  queryFn: () => listGrammar(getDb(), level.value),
});

const items = computed<GrammarSummary[]>(() => {
  const kw = query.value.trim().toLowerCase();
  const base = all.value ?? [];
  if (!kw) return base;
  return base.filter(
    (g) =>
      g.title.toLowerCase().includes(kw) ||
      (g.structure ?? "").toLowerCase().includes(kw) ||
      (g.meaning_vi ?? "").toLowerCase().includes(kw),
  );
});

watch(
  items,
  (list: GrammarSummary[]) => {
    if (!list.some((g) => g.id === selectedId.value))
      selectedId.value = list[0]?.id ?? null;
  },
  { immediate: true },
);

const { data: detail } = useQuery({
  queryKey: ["grammarDetail", selectedId],
  queryFn: () => getGrammarDetail(getDb(), selectedId.value as number),
  enabled: computed(() => selectedId.value != null),
});
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="mb-4 shrink-0">
      <h2 class="mb-3 text-2xl font-bold">Ngữ pháp</h2>
      <div class="flex flex-wrap items-center gap-3">
        <a-input
          v-model:value="query"
          allow-clear
          placeholder="Tìm mẫu ngữ pháp…"
          style="width: 260px"
        />
        <a-segmented v-model:value="level" :options="LEVELS" />
        <span class="text-sm text-muted">{{ items.length }} mẫu</span>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-4">
      <!-- Cột trái: danh sách mẫu ngữ pháp -->
      <ul class="n-card space-y-0.5 overflow-y-auto p-1.5">
        <li v-if="items.length === 0" class="p-6 text-center text-sm text-muted">
          Chưa có mẫu ngữ pháp {{ level
          }}{{ query.trim() ? " khớp từ khoá" : "" }}.
        </li>
        <li v-for="(g, i) in items" :key="g.id">
          <button
            type="button"
            @click="selectedId = g.id"
            :class="[
              'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
              selectedId === g.id ? 'bg-accent-soft' : 'hover:bg-accent-soft/60',
            ]"
          >
            <span class="w-5 shrink-0 text-xs text-muted">{{ i + 1 }}</span>
            <span class="min-w-0">
              <span class="jp block text-lg font-semibold">{{ g.title }}</span>
              <span
                v-if="g.meaning_vi"
                class="block truncate text-sm text-muted"
                >{{ g.meaning_vi }}</span
              >
            </span>
          </button>
        </li>
      </ul>

      <!-- Cột phải: chi tiết mẫu ngữ pháp -->
      <div class="n-card overflow-y-auto p-7">
        <template v-if="detail">
          <div class="flex items-center gap-3">
            <h2 class="jp text-3xl font-bold">{{ detail.title }}</h2>
            <BookmarkButton item-type="grammar" :item-id="detail.id" />
            <a-tag
              :bordered="false"
              :color="detail.jlpt_level === 'N5' ? 'green' : 'blue'"
              class="ml-auto"
              >{{ detail.jlpt_level }}</a-tag
            >
          </div>

          <p
            v-if="detail.structure"
            class="mt-3 rounded-lg bg-accent-soft px-3 py-2 font-mono text-sm"
          >
            {{ detail.structure }}
          </p>
          <p v-if="detail.meaning_vi" class="mt-3 text-lg font-medium text-accent">
            {{ detail.meaning_vi }}
          </p>
          <p
            v-if="detail.explanation_vi"
            class="mt-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 leading-relaxed text-ink dark:bg-amber-500/10"
          >
            {{ detail.explanation_vi }}
          </p>

          <div v-if="detail.examples.length > 0" class="mt-6">
            <h3
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Ví dụ
            </h3>
            <ul class="space-y-2">
              <li
                v-for="(ex, i) in detail.examples"
                :key="i"
                class="flex items-start gap-2"
              >
                <SpeakButton :text="ex.jp" />
                <div>
                  <p class="jp text-lg leading-relaxed">
                    <FuriganaText v-if="ex.furigana" :text="ex.furigana" />
                    <template v-else>{{ ex.jp }}</template>
                  </p>
                  <p class="text-sm text-muted">{{ ex.vi }}</p>
                </div>
              </li>
            </ul>
          </div>

          <NoteEditor item-type="grammar" :item-id="detail.id" />
        </template>
        <p v-else class="text-muted">Chọn một mẫu ngữ pháp ở danh sách bên trái.</p>
      </div>
    </div>
  </div>
</template>
