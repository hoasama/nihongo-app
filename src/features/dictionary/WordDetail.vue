<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useRoute, RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { getWordDetail } from "../../db/words.repo";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";
import FuriganaText from "../../shared/FuriganaText.vue";

const route = useRoute();
const wordId = Number(route.params.id);
const { data, isLoading } = useQuery({
  queryKey: ["word", wordId],
  queryFn: () => getWordDetail(getDb(), wordId),
});
</script>

<template>
  <p v-if="isLoading" class="text-slate-500">Đang tải…</p>
  <p v-else-if="!data">
    Không tìm thấy từ.
    <RouterLink to="/" class="text-indigo-600">← Quay lại</RouterLink>
  </p>
  <div v-else class="mx-auto max-w-2xl">
    <RouterLink to="/" class="text-sm text-indigo-600">← Tra từ</RouterLink>
    <div class="mt-2 flex items-center gap-3">
      <h2 class="text-3xl font-bold">{{ data.headword }}</h2>
      <SpeakButton :text="data.headword" />
      <BookmarkButton item-type="word" :item-id="data.id" />
    </div>
    <p class="text-slate-500">
      {{ data.reading_kana
      }}{{ data.reading_romaji ? ` · ${data.reading_romaji}` : "" }}
    </p>
    <span
      v-if="data.jlpt_level"
      class="mt-1 inline-block rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
      >{{ data.jlpt_level }}</span
    >

    <ol class="mt-4 list-decimal space-y-1 pl-5">
      <li v-for="(s, i) in data.senses" :key="i">
        <span
          v-if="s.part_of_speech"
          class="mr-2 text-xs uppercase text-slate-400"
          >{{ s.part_of_speech }}</span
        >
        <span>{{ s.gloss_vi || s.gloss_en }}</span>
        <span v-if="s.gloss_vi && s.gloss_en" class="ml-2 text-slate-400"
          >({{ s.gloss_en }})</span
        >
      </li>
    </ol>

    <div v-if="data.sentences.length > 0" class="mt-6">
      <h3 class="mb-2 font-semibold">Câu ví dụ</h3>
      <ul class="space-y-2">
        <li
          v-for="s in data.sentences"
          :key="s.id"
          class="flex items-start gap-2"
        >
          <SpeakButton :text="s.jp_text" />
          <div>
            <p class="leading-relaxed">
              <FuriganaText v-if="s.furigana" :text="s.furigana" />
              <template v-else>{{ s.jp_text }}</template>
            </p>
            <p v-if="s.translation_en" class="text-sm text-slate-500">
              {{ s.translation_en }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <NoteEditor item-type="word" :item-id="data.id" />
  </div>
</template>
