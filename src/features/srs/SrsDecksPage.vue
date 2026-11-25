<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { getDb } from "../../db/client";
import { listDecks, getDeckCounts } from "../../db/srs.repo";
import { useSettings } from "../../shared/settingsStore";
import type { DeckCategory } from "../../shared/types";

const route = useRoute();
const settings = useSettings();
// Không có :category → Flashcard gộp cả Từ vựng lẫn Kanji.
const categories = computed<DeckCategory[]>(() =>
  route.params.category
    ? [route.params.category as DeckCategory]
    : ["vocab", "kanji"],
);
const CAT_LABEL: Record<DeckCategory, string> = { vocab: "Từ vựng", kanji: "Kanji" };

const { data: groups } = useQuery({
  queryKey: ["srs-decks", categories],
  queryFn: async () => {
    const db = getDb();
    return Promise.all(
      categories.value.map(async (cat) => ({
        cat,
        decks: await Promise.all(
          (await listDecks(db, cat)).map(async (d) => ({
            ...d,
            counts: await getDeckCounts(db, d.id, settings.srsNewPerDay),
          })),
        ),
      })),
    );
  },
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-4 text-2xl font-bold">Flashcard</h2>
    <div v-for="g in groups" :key="g.cat" class="mb-6">
      <h3 v-if="categories.length > 1" class="mb-2 font-semibold text-muted">
        {{ CAT_LABEL[g.cat] }}
      </h3>
      <ul class="space-y-2">
        <li
          v-for="d in g.decks"
          :key="d.id"
          class="flex items-center justify-between n-card p-4"
        >
          <div>
            <p class="font-medium">{{ d.name }}</p>
            <p class="text-sm text-muted">
              Đến hạn: <b class="text-accent">{{ d.counts.due }}</b> · Mới:
              <b class="text-ink">{{ d.counts.newRemaining }}</b>
            </p>
          </div>
          <!-- href hash (router dùng hash history) để vẫn là link thật: Ctrl/giữa-click được -->
          <a-button
            v-if="d.counts.due + d.counts.newRemaining > 0"
            type="primary"
            :href="`#/review/session/${d.id}`"
          >
            Học
          </a-button>
          <span v-else class="text-sm text-muted">Hôm nay xong ✓</span>
        </li>
      </ul>
    </div>
  </div>
</template>
