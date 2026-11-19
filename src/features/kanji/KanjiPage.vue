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
    <h2 class="mb-3 text-2xl font-bold">Kanji</h2>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <a-input
        v-model:value="query"
        allow-clear
        placeholder="Tìm kanji hoặc nghĩa (vd: 日, water)…"
        style="width: 320px"
      />
      <a-segmented v-model:value="level" :options="LEVELS" :disabled="searching" />
    </div>

    <p v-if="data && data.length === 0" class="text-muted">
      Không có kanji phù hợp.
    </p>

    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2"
    >
      <RouterLink
        v-for="k in data"
        :key="k.id"
        :to="`/kanji/${k.id}`"
        class="n-card flex flex-col items-center p-2 hover:border-accent"
      >
        <span class="jp text-3xl font-bold">{{ k.literal }}</span>
        <span class="mt-1 line-clamp-1 text-center text-xs text-muted">
          {{ k.meaning_en }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>
