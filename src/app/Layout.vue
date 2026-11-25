<script setup lang="ts">
import { computed, h } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useIsFetching } from "@tanstack/vue-query";

const route = useRoute();
const router = useRouter();

// Thanh loading hiện khi còn query đang chạy (chuyển màn/menu/tab đều kích hoạt).
const isFetching = useIsFetching();

function ico(char: string) {
  return () => h("span", { class: "nav-ico jp" }, char);
}

const items = [
  { key: "/", label: "Tra từ", icon: ico("辞") },
  { key: "/kanji", label: "Kanji", icon: ico("漢") },
  { key: "/grammar", label: "Ngữ pháp", icon: ico("文") },
  { key: "/read", label: "Luyện đọc", icon: ico("読") },
  { key: "/review", label: "Flashcard", icon: ico("覚") },
  { key: "/saved", label: "Đã lưu", icon: ico("保") },
  { key: "/settings", label: "Cài đặt", icon: ico("設") },
];

// Khớp menu đang chọn theo path hiện tại.
const selectedKeys = computed(() => {
  const p = route.path;
  if (p === "/" || p.startsWith("/word")) return ["/"];
  if (p.startsWith("/review")) return ["/review"];
  if (p.startsWith("/read")) return ["/read"];
  if (p.startsWith("/kanji")) return ["/kanji"];
  if (p.startsWith("/grammar")) return ["/grammar"];
  if (p.startsWith("/saved")) return ["/saved"];
  if (p.startsWith("/settings")) return ["/settings"];
  return [];
});

function onClick({ key }: { key: string }) {
  if (key !== route.path) router.push(key);
}
</script>

<template>
  <a-layout class="h-full">
    <a-layout-sider
      :width="240"
      theme="dark"
      class="app-sider flex flex-col px-3 py-4"
    >
      <div class="px-2.5 pt-1 pb-[18px]">
        <div class="jp text-[28px] font-bold leading-[1.1] text-white">日本語</div>
        <div class="text-xs text-side-text opacity-80">Nihongo · N5 / N4</div>
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :items="items"
        :selected-keys="selectedKeys"
        @click="onClick"
      />
      <RouterLink
        to="/about"
        class="mt-auto px-3 pt-3 pb-0.5 text-xs text-side-text/60 hover:text-white"
        >Nguồn dữ liệu</RouterLink
      >
    </a-layout-sider>

    <a-layout-content class="relative h-full overflow-auto px-7 py-6">
      <div v-if="isFetching" class="top-loading" />
      <RouterView :key="route.fullPath" />
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
/* Chỉ giữ CSS cho phần :deep() vào nội bộ antd (utility không nhắm được) */
.app-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-sider :deep(.ant-menu) {
  border-inline-end: 0;
  background: transparent;
}
</style>
