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
      <div class="flex gap-1.5">
        <button
          v-for="l in LEVELS"
          :key="l"
          type="button"
          @click="level = l"
          :class="[
            'chip',
            level === l
              ? 'chip-on'
              : '',
          ]"
        >
          {{ l }}
        </button>
      </div>
      <input
        v-model="query"
        placeholder="Tìm mẫu ngữ pháp…"
        class="flex-1 field"
      />
    </div>

    <p v-if="items && items.length === 0" class="text-muted">
      Chưa có mẫu ngữ pháp {{ level }}{{ query.trim() ? " khớp từ khoá" : "" }}.
    </p>

    <ul class="divide-y divide-line">
      <li v-for="g in items" :key="g.id">
        <RouterLink
          :to="`/grammar/${g.id}`"
          class="block py-2 hover:bg-accent-soft"
        >
          <span class="text-lg">{{ g.title }}</span>
          <span v-if="g.structure" class="ml-2 text-sm text-muted">{{
            g.structure
          }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
