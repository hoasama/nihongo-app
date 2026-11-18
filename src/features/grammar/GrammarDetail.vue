<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useRoute, RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { getGrammarDetail } from "../../db/grammar.repo";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";

const route = useRoute();
const gId = Number(route.params.id);
const { data, isLoading } = useQuery({
  queryKey: ["grammarDetail", gId],
  queryFn: () => getGrammarDetail(getDb(), gId),
});
</script>

<template>
  <p v-if="isLoading" class="text-muted">Đang tải…</p>
  <p v-else-if="!data">
    Không tìm thấy mẫu ngữ pháp.
    <RouterLink to="/grammar" class="text-accent">← Quay lại</RouterLink>
  </p>
  <div v-else class="mx-auto max-w-2xl">
    <RouterLink to="/grammar" class="text-sm text-accent"
      >← Ngữ pháp</RouterLink
    >
    <div class="mt-2 flex items-center gap-3">
      <h2 class="jp text-2xl font-bold">{{ data.title }}</h2>
      <BookmarkButton item-type="grammar" :item-id="data.id" />
      <span
        class="tag ml-auto"
        :data-level="data.jlpt_level"
        >{{ data.jlpt_level }}</span
      >
    </div>

    <p
      v-if="data.structure"
      class="mt-2 rounded-lg bg-accent-soft px-3 py-2 font-mono text-sm"
    >
      {{ data.structure }}
    </p>
    <p v-if="data.meaning_vi" class="mt-3 font-medium">{{ data.meaning_vi }}</p>
    <p v-if="data.explanation_vi" class="mt-2 text-muted">
      {{ data.explanation_vi }}
    </p>

    <div v-if="data.examples.length > 0" class="mt-5">
      <h3 class="mb-2 font-semibold">Ví dụ</h3>
      <ul class="space-y-2">
        <li
          v-for="(ex, i) in data.examples"
          :key="i"
          class="flex items-start gap-2"
        >
          <SpeakButton :text="ex.jp" />
          <div>
            <p>{{ ex.jp }}</p>
            <p class="text-sm text-muted">{{ ex.vi }}</p>
          </div>
        </li>
      </ul>
    </div>

    <NoteEditor item-type="grammar" :item-id="data.id" />
  </div>
</template>
