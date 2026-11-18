<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useRoute, RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { getKanjiDetail } from "../../db/kanji.repo";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";

const route = useRoute();
const kanjiId = Number(route.params.id);
const { data, isLoading } = useQuery({
  queryKey: ["kanji", kanjiId],
  queryFn: () => getKanjiDetail(getDb(), kanjiId),
});
</script>

<template>
  <p v-if="isLoading" class="text-muted">Đang tải…</p>
  <p v-else-if="!data">
    Không tìm thấy kanji.
    <RouterLink to="/kanji" class="text-accent">← Quay lại</RouterLink>
  </p>
  <div v-else class="mx-auto max-w-2xl">
    <RouterLink to="/kanji" class="text-sm text-accent">← Kanji</RouterLink>
    <div class="mt-2 flex items-center gap-4">
      <span class="jp text-7xl font-bold leading-none">{{ data.literal }}</span>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <SpeakButton :text="data.literal" />
          <BookmarkButton item-type="kanji" :item-id="data.id" />
          <span
            v-if="data.jlpt_level"
            class="tag ml-auto"
            :data-level="data.jlpt_level"
            >{{ data.jlpt_level }}</span
          >
        </div>
        <span class="text-lg">{{ data.meaning_vi || data.meaning_en }}</span>
      </div>
    </div>

    <div class="mt-4 text-sm">
      <div v-if="data.on_readings" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Âm On</span>
        <span>{{ data.on_readings }}</span>
      </div>
      <div v-if="data.kun_readings" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Âm Kun</span>
        <span>{{ data.kun_readings }}</span>
      </div>
      <div v-if="data.stroke_count" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Số nét</span>
        <span>{{ data.stroke_count }}</span>
      </div>
      <div v-if="data.radical" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Bộ thủ</span>
        <span>{{ data.radical }}</span>
      </div>
      <div v-if="data.grade" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Grade</span>
        <span>{{ data.grade }}</span>
      </div>
      <div v-if="data.meaning_vi" class="flex gap-2 py-1">
        <span class="w-28 shrink-0 text-muted">Nghĩa (EN)</span>
        <span>{{ data.meaning_en }}</span>
      </div>
    </div>

    <div v-if="data.words.length > 0" class="mt-6">
      <h3 class="mb-2 font-semibold">Từ chứa kanji này</h3>
      <ul class="divide-y divide-line">
        <li v-for="w in data.words" :key="w.id">
          <RouterLink
            :to="`/word/${w.id}`"
            class="flex items-baseline gap-3 py-1.5 hover:bg-accent-soft"
          >
            <span class="text-lg">{{ w.headword }}</span>
            <span class="text-sm text-muted">{{ w.reading_kana }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <NoteEditor item-type="kanji" :item-id="data.id" />
  </div>
</template>
