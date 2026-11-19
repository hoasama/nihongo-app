<script setup lang="ts">
// Render ký hiệu furigana của OpenJLPT: "{漢字|かな}" → ruby, phần ngoài ngoặc giữ nguyên.
// Ví dụ: "もう{会|あ}った" → もう<ruby>会<rt>あ</rt></ruby>った
// Ẩn/hiện theo cài đặt "Hiện furigana" (Settings) — khi tắt, hiện chữ Hán trơn, bỏ cách đọc nhỏ.
import { useSettings } from "./settingsStore";

const props = defineProps<{ text: string }>();
const settings = useSettings();

interface Seg {
  base: string;
  rt?: string;
}

function parse(t: string): Seg[] {
  const segs: Seg[] = [];
  const re = /\{([^|{}]+)\|([^|{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) segs.push({ base: t.slice(last, m.index) });
    segs.push({ base: m[1], rt: m[2] });
    last = m.index + m[0].length;
  }
  if (last < t.length) segs.push({ base: t.slice(last) });
  return segs;
}
</script>

<template>
  <span
    ><template v-for="(seg, i) in parse(props.text)" :key="i"
      ><ruby v-if="seg.rt && settings.showFurigana"
        >{{ seg.base }}<rt class="text-[0.5em] text-accent">{{
          seg.rt
        }}</rt></ruby
      ><template v-else>{{ seg.base }}</template></template
    ></span
  >
</template>
