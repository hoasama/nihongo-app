<script setup lang="ts">
// Tag cấp JLPT dùng chung cho mọi trang: N5 hồng, N4 lilac (theo palette),
// cấp khác xám ở light / Tiffany ở dark (để khác badge loại từ màu xám bên cạnh).
import { computed } from "vue";
import { useSettings } from "./settingsStore";

const props = defineProps<{ level: string | null | undefined }>();
const settings = useSettings();

const COLORS: Record<string, string> = { N5: "magenta", N4: "purple" };
// Dark: preset antd ra nền gần đen, chữ mờ → dùng pastel của palette, chữ đậm cho sáng rõ.
const DARK: Record<string, { background: string; color: string }> = {
  N5: { background: "#ffc8dd", color: "#4a1f33" },
  N4: { background: "#cdb4db", color: "#2e1f3d" },
};
const darkStyle = computed(() =>
  settings.theme === "dark" && props.level
    ? (DARK[props.level] ?? { background: "#81d8d0", color: "#0b3b37" })
    : undefined,
);
</script>

<template>
  <a-tag
    v-if="level"
    :bordered="false"
    :color="darkStyle ? undefined : COLORS[level]"
    :style="darkStyle"
    >{{ level }}</a-tag
  >
</template>
