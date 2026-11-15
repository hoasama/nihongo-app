<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { listByLevel, searchKanji } from "../../db/kanji.repo";
import { useDebounce } from "../../shared/useDebounce";

const LEVELS = ["N5", "N4"];
const level = ref("N5");
const query = ref("");
const q = useDebounce(
  computed(() => query.value.trim()),
  250,
);
const searching = computed(() => q.value.length > 0);

const { data } = useQuery({
  queryKey: ["kanji", q, level],
  queryFn: () =>
    searching.value ? searchKanji(getDb(), q.value) : listByLevel(getDb(), level.value),
});
</script>

<template>
  <div>
    <h2 class="mb-3 text-xl font-semibold">Kanji</h2>

    <div class="mb-4 flex items-center gap-2">
      <div class="flex rounded border border-slate-300 dark:border-slate-700">
        <button
          v-for="l in LEVELS"
          :key="l"
          type="button"
          @click="level = l"
          :class="[
            'px-3 py-1.5 text-sm',
            !searching && level === l
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800',
          ]"
        >
          {{ l }}
        </button>
      </div>
      <input
        v-model="query"
        placeholder="Tìm kanji hoặc nghĩa (vd: 日, water)…"
        class="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />
    </div>

    <p v-if="data && data.length === 0" class="text-slate-500">
      Không có kanji phù hợp.
    </p>

    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2"
    >
      <RouterLink
        v-for="k in data"
        :key="k.id"
        :to="`/kanji/${k.id}`"
        class="flex flex-col items-center rounded border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
      >
        <span class="text-3xl">{{ k.literal }}</span>
        <span class="mt-1 line-clamp-1 text-center text-xs text-slate-500">
          {{ k.meaning_en }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>
