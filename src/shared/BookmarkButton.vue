<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { getDb } from "../db/client";
import { addBookmark, isBookmarked, removeBookmark } from "../db/user.repo";
import type { ItemType } from "./types";

const props = defineProps<{ itemType: ItemType; itemId: number }>();
const qc = useQueryClient();
const key = ["bookmarked", props.itemType, props.itemId];

const { data: marked } = useQuery({
  queryKey: key,
  queryFn: () => isBookmarked(getDb(), props.itemType, props.itemId),
});

async function toggle() {
  if (marked.value)
    await removeBookmark(getDb(), props.itemType, props.itemId);
  else await addBookmark(getDb(), props.itemType, props.itemId);
  qc.invalidateQueries({ queryKey: key });
  qc.invalidateQueries({ queryKey: ["bookmarks"] });
}
</script>

<template>
  <button
    type="button"
    @click="toggle"
    :title="marked ? 'Bỏ lưu' : 'Lưu'"
    :aria-label="marked ? 'Bỏ lưu từ này' : 'Lưu từ này'"
    :aria-pressed="marked"
    class="text-xl text-amber-500 cursor-pointer motion-safe:hover:scale-110"
  >
    <span aria-hidden="true">{{ marked ? "★" : "☆" }}</span>
  </button>
</template>
