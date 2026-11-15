<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { listGrammar } from "../../db/grammar.repo";

const LEVELS = ["N5", "N4"];
const level = ref("N5");
const query = ref("");

const { data } = useQuery({
  queryKey: ["grammar", level],
  queryFn: () => listGrammar(getDb(), level.value),
});

const items = computed(() => {
  const kw = query.value.trim().toLowerCase();
  if (!kw) return data.value;
  return data.value?.filter((g) => g.title.toLowerCase().includes(kw));
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-3 text-xl font-semibold">Ngữ pháp</h2>

    <div class="mb-4 flex items-center gap-2">
      <div class="flex rounded border border-slate-300 dark:border-slate-700">
        <button
          v-for="l in LEVELS"
          :key="l"
          type="button"
          @click="level = l"
          :class="[
            'px-3 py-1.5 text-sm',
            level === l
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800',
          ]"
        >
          {{ l }}
        </button>
      </div>
      <input
        v-model="query"
        placeholder="Tìm mẫu ngữ pháp…"
        class="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />
    </div>

    <p v-if="items && items.length === 0" class="text-slate-500">
      Chưa có mẫu ngữ pháp {{ level }}{{ query.trim() ? " khớp từ khoá" : "" }}.
    </p>

    <ul class="divide-y divide-slate-200 dark:divide-slate-800">
      <li v-for="g in items" :key="g.id">
        <RouterLink
          :to="`/grammar/${g.id}`"
          class="block py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <span class="text-lg">{{ g.title }}</span>
          <span v-if="g.structure" class="ml-2 text-sm text-slate-500">{{
            g.structure
          }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
