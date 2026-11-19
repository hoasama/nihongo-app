<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useRoute, RouterLink } from "vue-router";
import { getDb } from "../../db/client";
import { getWordDetail } from "../../db/words.repo";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import BookmarkButton from "../../shared/BookmarkButton.vue";
import NoteEditor from "../../shared/NoteEditor.vue";
import FuriganaText from "../../shared/FuriganaText.vue";
import { formatPos } from "../../shared/pos";

const route = useRoute();
const wordId = Number(route.params.id);
const { data, isLoading } = useQuery({
  queryKey: ["word", wordId],
  queryFn: () => getWordDetail(getDb(), wordId),
});
</script>

<template>
  <p v-if="isLoading" class="text-muted">Đang tải…</p>
  <p v-else-if="!data">
    Không tìm thấy từ.
    <RouterLink to="/" class="text-accent">← Quay lại</RouterLink>
  </p>
  <div v-else class="mx-auto max-w-2xl">
    <RouterLink to="/" class="text-sm text-accent">← Tra từ</RouterLink>
    <div class="mt-2 flex items-center gap-3">
      <h2 class="jp text-4xl font-bold">{{ data.headword }}</h2>
      <SpeakButton :text="data.headword" />
      <BookmarkButton item-type="word" :item-id="data.id" />
    </div>
    <p class="jp text-lg text-accent">
      {{ data.reading_kana
      }}{{ data.reading_romaji ? ` · ${data.reading_romaji}` : "" }}
    </p>
    <span
      v-if="data.jlpt_level"
      class="tag ml-auto"
      :data-level="data.jlpt_level"
      >{{ data.jlpt_level }}</span
    >

    <ol class="mt-4 list-decimal space-y-1 pl-5">
      <li v-for="(s, i) in data.senses" :key="i">
        <span
          v-if="formatPos(s.part_of_speech)"
          class="mr-2 text-xs text-muted"
          >{{ formatPos(s.part_of_speech) }}</span
        >
        <span>{{ s.gloss_vi || s.gloss_en }}</span>
        <span v-if="s.gloss_vi && s.gloss_en" class="ml-2 text-muted"
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
            <p v-if="s.translation_en" class="text-sm text-muted">
              {{ s.translation_en }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <NoteEditor item-type="word" :item-id="data.id" />
  </div>
</template>
