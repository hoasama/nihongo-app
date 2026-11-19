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
    <h2 class="mb-4 text-2xl font-bold">{{ title }}</h2>
    <ul class="space-y-2">
      <li
        v-for="d in decks"
        :key="d.id"
        class="flex items-center justify-between n-card p-4"
      >
        <div>
          <p class="font-medium">{{ d.name }}</p>
          <p class="text-sm text-muted">
            Đến hạn: <b class="text-accent">{{ d.counts.due }}</b> · Mới:
            <b class="text-[#1c7ed6]">{{ d.counts.newRemaining }}</b>
          </p>
        </div>
        <RouterLink
          v-if="d.counts.due + d.counts.newRemaining > 0"
          :to="`/review/session/${d.id}`"
          class="btn btn-primary"
        >
          Học
        </RouterLink>
        <span v-else class="text-sm text-muted">Hôm nay xong ✓</span>
      </li>
    </ul>
  </div>
</template>
