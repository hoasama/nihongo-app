<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { searchWords } from "../../db/words.repo";
import { useDebounce } from "../../shared/useDebounce";

const inputCls =
  "rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900";

const query = ref("");
const level = ref("");
const q = useDebounce(
  computed(() => query.value.trim()),
  250,
);

const { data, isFetching } = useQuery({
  queryKey: ["words", q, level],
  queryFn: () => searchWords(getDb(), q.value, level.value || undefined),
  enabled: computed(() => q.value.length > 0),
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-3 text-xl font-semibold">Tra từ điển</h2>
    <div class="mb-4 flex gap-2">
      <input
        v-model="query"
        placeholder="Nhập kanji, kana, romaji hoặc nghĩa…"
        :class="['flex-1', inputCls]"
      />
      <div class="relative">
        <select v-model="level" :class="[inputCls, 'appearance-none pr-9']">
          <option value="">Mọi cấp</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
        </select>
        <span
          class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"
          >▾</span
        >
      </div>
    </div>

    <p
      v-if="q.length > 0 && !isFetching && data && data.length === 0"
      class="text-slate-500"
    >
      Không tìm thấy từ nào.
    </p>

    <ul class="divide-y divide-slate-200 dark:divide-slate-800">
      <li v-for="w in data" :key="w.id">
        <RouterLink
          :to="`/word/${w.id}`"
          class="flex items-baseline gap-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <span class="text-lg">{{ w.headword }}</span>
          <span class="text-sm text-slate-500">{{ w.reading_kana }}</span>
          <span
            v-if="w.jlpt_level"
            class="ml-auto rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
            >{{ w.jlpt_level }}</span
          >
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
