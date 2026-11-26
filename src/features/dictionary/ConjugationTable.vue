<script setup lang="ts">
// Bảng chia động từ / tính từ của một từ; không render gì nếu từ không chia được.
import { computed } from "vue";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import { conjugate } from "./conjugate";
import type { WordDetail } from "../../shared/types";

const props = defineProps<{ word: Pick<WordDetail, "headword" | "reading_kana" | "senses"> }>();
const conj = computed(() =>
  conjugate(props.word.headword, props.word.reading_kana, props.word.senses.map((s) => s.part_of_speech)),
);
</script>

<template>
  <details v-if="conj" open class="mt-6">
    <summary class="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
      {{ conj.title }}
      <span v-if="conj.group" class="ml-1 normal-case">· {{ conj.group }}</span>
    </summary>
    <table class="mt-2 w-full text-sm">
      <tbody>
        <tr v-for="f in conj.forms" :key="f.id" class="border-b border-line">
          <td class="w-44 py-1.5 pr-3 text-muted">{{ f.name }}</td>
          <td class="jp py-1.5 text-base">{{ f.w }}</td>
          <td class="jp py-1.5 text-muted">{{ f.w !== f.k ? f.k : "" }}</td>
          <td class="w-8 py-1"><SpeakButton :text="f.k" /></td>
        </tr>
      </tbody>
    </table>
  </details>
</template>
