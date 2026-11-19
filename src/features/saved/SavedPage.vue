<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { listBookmarksDetailed } from "../../db/user.repo";
import type { ItemType } from "../../shared/types";

const GROUPS: { type: ItemType; title: string; base: string }[] = [
  { type: "word", title: "Từ vựng", base: "/word" },
  { type: "kanji", title: "Kanji", base: "/kanji" },
  { type: "grammar", title: "Ngữ pháp", base: "/grammar" },
];

const { data } = useQuery({
  queryKey: ["bookmarks"],
  queryFn: () => listBookmarksDetailed(getDb()),
});

const isEmpty = computed(() => data.value && data.value.length === 0);
function group(type: ItemType) {
  return data.value?.filter((b) => b.item_type === type) ?? [];
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-3 text-2xl font-bold">Đã lưu</h2>
    <p v-if="isEmpty" class="text-muted">
      Chưa có mục nào. Bấm ★ ở trang từ/kanji/ngữ pháp để lưu.
    </p>

    <template v-for="g in GROUPS" :key="g.type">
      <div v-if="group(g.type).length > 0" class="mb-5">
        <h3 class="mb-1 font-semibold text-muted">
          {{ g.title }}
        </h3>
        <ul class="divide-y divide-line">
          <li v-for="b in group(g.type)" :key="b.id">
            <RouterLink
              :to="`${g.base}/${b.item_id}`"
              class="block py-2 hover:bg-accent-soft"
            >
              {{ b.label ?? `#${b.item_id}` }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
