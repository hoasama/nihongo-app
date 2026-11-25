<script setup lang="ts">
import { ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getDb } from "../db/client";
import { getNote, saveNote } from "../db/user.repo";
import { useDebounce } from "./useDebounce";
import type { ItemType } from "./types";

const props = defineProps<{ itemType: ItemType; itemId: number }>();

const { data } = useQuery({
  queryKey: ["note", props.itemType, props.itemId],
  queryFn: () => getNote(getDb(), props.itemType, props.itemId),
});

const text = ref("");
watch(data, (d) => {
  text.value = d ?? "";
});

const debounced = useDebounce(text, 600);
watch(debounced, (val) => {
  if (val !== (data.value ?? "")) {
    void saveNote(getDb(), props.itemType, props.itemId, val);
  }
});
</script>

<template>
  <div class="mt-6">
    <h3 class="mb-1 font-semibold">Ghi chú</h3>
    <a-textarea
      v-model:value="text"
      :rows="3"
      aria-label="Ghi chú"
      placeholder="Ghi chú cá nhân, tự lưu…"
    />
  </div>
</template>
