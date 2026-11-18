<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRoute } from "vue-router";
import { getDb } from "../../db/client";
import { listDecks, getDeckCounts } from "../../db/srs.repo";
import { useSettings } from "../../shared/settingsStore";
import type { DeckCategory } from "../../shared/types";

const route = useRoute();
const settings = useSettings();
const category = computed(() => route.params.category as DeckCategory);
const title = computed(() =>
  category.value === "kanji" ? "Ôn tập Kanji" : "Ôn tập Từ vựng",
);

const { data: decks } = useQuery({
  queryKey: ["srs-decks", category],
  queryFn: async () => {
    const db = getDb();
    const list = await listDecks(db, category.value);
    return Promise.all(
      list.map(async (d) => ({
        ...d,
        counts: await getDeckCounts(db, d.id, settings.srsNewPerDay),
      })),
    );
  },
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-4 text-xl font-semibold">{{ title }}</h2>
    <ul class="space-y-2">
      <li
        v-for="d in decks"
        :key="d.id"
        class="flex items-center justify-between rounded border border-slate-200 p-3 dark:border-slate-800"
      >
        <div>
          <p class="font-medium">{{ d.name }}</p>
          <p class="text-sm text-slate-500">
            Đến hạn: <b>{{ d.counts.due }}</b> · Mới:
            <b>{{ d.counts.newRemaining }}</b>
          </p>
        </div>
        <RouterLink
          v-if="d.counts.due + d.counts.newRemaining > 0"
          :to="`/review/session/${d.id}`"
          class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          Học
        </RouterLink>
        <span v-else class="text-sm text-slate-400">Hôm nay xong ✓</span>
      </li>
    </ul>
  </div>
</template>
