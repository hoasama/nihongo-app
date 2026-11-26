<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getDb } from "../../db/client";
import {
  searchWords,
  listWords,
  listBookmarkedWords,
  getWordDetail,
} from "../../db/words.repo";
import type { WordSummary } from "../../shared/types";
import { WORD_TYPES, primaryPos, type WordType } from "../../shared/pos";
import { useDebounce } from "../../shared/useDebounce";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";
import FuriganaText from "../../shared/FuriganaText.vue";
import LevelTag from "../../shared/LevelTag.vue";
import ConjugationTable from "./ConjugationTable.vue";

type Filter = "all" | "N5" | "N4" | "N3" | "fav";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "N5", label: "N5" },
  { value: "N4", label: "N4" },
  { value: "N3", label: "N3" },
  { value: "fav", label: "★ Yêu thích" },
];
const typeOptions = WORD_TYPES.map((t) => ({ label: t.label, value: t.v }));

const query = ref("");
const filter = ref<Filter>("all");
const wordType = ref<WordType>("all");
const selectedId = ref<number | null>(null);

const q = useDebounce(
  computed(() => query.value.trim()),
  250,
);

const { data: list } = useQuery({
  queryKey: ["word-list", q, filter, wordType],
  queryFn: async () => {
    const db = getDb();
    const level =
      filter.value === "all" || filter.value === "fav"
        ? undefined
        : filter.value;
    const t = wordType.value;
    if (filter.value === "fav") {
      const favs = await listBookmarkedWords(db, t);
      const kw = q.value.toLowerCase();
      if (!kw) return favs;
      return favs.filter(
        (w) =>
          w.headword.includes(q.value) ||
          w.reading_kana.includes(q.value) ||
          (w.gloss ?? "").toLowerCase().includes(kw),
      );
    }
    if (q.value.length > 0) return searchWords(db, q.value, level, t);
    return listWords(db, level, t);
  },
});

watch(
  list,
  (items: WordSummary[] | undefined) => {
    if (!items) return;
    if (!items.some((w) => w.id === selectedId.value))
      selectedId.value = items[0]?.id ?? null;
  },
  { immediate: true },
);

const { data: detail } = useQuery({
  queryKey: ["word", selectedId],
  queryFn: () => getWordDetail(getDb(), selectedId.value as number),
  enabled: computed(() => selectedId.value != null),
});

const count = computed(() => list.value?.length ?? 0);

const KANJI_RE = /[一-龯]/;
function kanjiChars(s: string): string[] {
  return [...new Set([...s].filter((c) => KANJI_RE.test(c)))];
}
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="mb-4 shrink-0">
      <h2 class="mb-3 text-2xl font-bold">Tra từ vựng</h2>
      <div class="flex flex-wrap items-center gap-3">
        <a-input
          v-model:value="query"
          allow-clear
          placeholder="Nhập kanji, kana, romaji (taberu) hoặc tiếng Việt (ăn)…"
          style="width: 320px"
        />
        <a-select v-model:value="filter" :options="FILTERS" class="w-36" />
        <a-select
          v-model:value="wordType"
          :options="typeOptions"
          style="width: 170px"
        />
        <span class="text-sm text-muted">{{ count }} từ</span>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-4">
      <!-- Cột trái: danh sách chọn từ -->
      <ul class="n-card space-y-0.5 overflow-y-auto p-1.5">
        <li v-if="count === 0" class="p-6 text-center text-sm text-muted">
          {{
            filter === "fav"
              ? "Chưa có từ yêu thích. Bấm ★ để lưu."
              : "Không tìm thấy từ phù hợp."
          }}
        </li>
        <li v-for="w in list" :key="w.id">
          <button
            type="button"
            @click="selectedId = w.id"
            :class="[
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
              selectedId === w.id ? 'bg-accent-soft' : 'hover:bg-accent-soft/60',
            ]"
          >
            <span class="min-w-0">
              <span class="jp block truncate text-xl font-semibold">{{
                w.headword
              }}</span>
              <span class="jp block truncate text-sm text-muted">{{
                w.reading_kana
              }}</span>
            </span>
            <span
              v-if="w.gloss"
              class="ml-auto max-w-[45%] truncate text-right text-sm text-muted"
              >{{ w.gloss }}</span
            >
            <LevelTag
              :level="w.jlpt_level"
              :class="{ 'ml-auto': !w.gloss }"
              class="shrink-0"
            />
          </button>
        </li>
      </ul>

      <!-- Cột phải: chi tiết từ đang chọn -->
      <div class="n-card overflow-y-auto p-7">
        <template v-if="detail">
          <div class="flex flex-wrap items-center gap-2">
            <LevelTag :level="detail.jlpt_level" />
            <a-tag v-if="primaryPos(detail.senses[0]?.part_of_speech)" :bordered="false">{{
              primaryPos(detail.senses[0]?.part_of_speech)
            }}</a-tag>
          </div>
          <div class="mt-2 flex items-center gap-3">
            <h2 class="jp text-6xl font-bold leading-none">
              {{ detail.headword }}
            </h2>
            <SpeakButton :text="detail.headword" />
            <BookmarkButton item-type="word" :item-id="detail.id" />
          </div>
          <p class="jp mt-3 text-xl">
            <span class="text-accent">{{ detail.reading_kana }}</span>
            <span v-if="detail.reading_romaji" class="ml-2 text-base text-muted">{{
              detail.reading_romaji
            }}</span>
          </p>

          <ol class="mt-4 list-decimal space-y-1 pl-5 text-lg">
            <li v-for="(s, i) in detail.senses" :key="i">
              <span>{{ s.gloss_vi || s.gloss_en }}</span>
              <span v-if="s.gloss_vi && s.gloss_en" class="ml-2 text-base text-muted"
                >({{ s.gloss_en }})</span
              >
            </li>
          </ol>

          <ConjugationTable :word="detail" />

          <template v-if="kanjiChars(detail.headword).length">
            <h3
              class="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Chữ Hán
            </h3>
            <div class="flex flex-wrap gap-2">
              <a-button
                v-for="c in kanjiChars(detail.headword)"
                :key="c"
                type="primary"
                size="small"
                class="jp"
                title="Tìm từ chứa chữ này"
                @click="
                  query = c;
                  filter = 'all';
                "
              >
                {{ c }}
              </a-button>
            </div>
          </template>

          <div v-if="detail.sentences.length > 0" class="mt-6">
            <h3
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Câu ví dụ
            </h3>
            <ul class="space-y-2">
              <li
                v-for="s in detail.sentences"
                :key="s.id"
                class="flex items-start gap-2"
              >
                <SpeakButton :text="s.jp_text" />
                <div>
                  <p class="jp text-lg leading-relaxed">
                    <FuriganaText v-if="s.furigana" :text="s.furigana" />
                    <template v-else>{{ s.jp_text }}</template>
                  </p>
                  <p v-if="s.translation_en" class="text-sm text-muted">
                    {{ s.translation_en }}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <NoteEditor item-type="word" :item-id="detail.id" />
        </template>
        <p v-else class="text-muted">Chọn một từ ở danh sách bên trái.</p>
      </div>
    </div>
  </div>
</template>
