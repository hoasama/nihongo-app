<script setup lang="ts">
import { computed, h } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

function ico(char: string) {
  return () => h("span", { class: "nav-ico jp" }, char);
}

const items = [
  { key: "/", label: "Tra từ", icon: ico("辞") },
  { key: "/kanji", label: "Kanji", icon: ico("漢") },
  { key: "/grammar", label: "Ngữ pháp", icon: ico("文") },
  {
    type: "group",
    label: "Ôn tập",
    children: [
      { key: "/review/vocab", label: "Từ vựng", icon: ico("語") },
      { key: "/review/kanji", label: "Kanji", icon: ico("字") },
    ],
  },
  { key: "/saved", label: "Đã lưu", icon: ico("保") },
  { key: "/settings", label: "Cài đặt", icon: ico("設") },
];

// Khớp menu đang chọn theo path hiện tại.
const selectedKeys = computed(() => {
  const p = route.path;
  if (p === "/" || p.startsWith("/word")) return ["/"];
  if (p.startsWith("/review/kanji")) return ["/review/kanji"];
  if (p.startsWith("/review")) return ["/review/vocab"];
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
  <a-layout class="app-shell">
    <a-layout-sider :width="240" theme="dark" class="app-sider">
      <div class="brand">
        <div class="jp brand-jp">日本語</div>
        <div class="brand-sub">Nihongo · N5 / N4</div>
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :items="items"
        :selected-keys="selectedKeys"
        @click="onClick"
      />
      <a class="about-link" @click="router.push('/about')">Nguồn dữ liệu</a>
    </a-layout-sider>

    <a-layout-content class="app-content">
      <RouterView :key="route.fullPath" />
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
.app-shell {
  height: 100%;
}
.app-sider {
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
}
.app-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-sider :deep(.ant-menu) {
  border-inline-end: 0;
  background: transparent;
}
.brand {
  padding: 4px 10px 18px;
}
.brand-jp {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}
.brand-sub {
  font-size: 12px;
  color: #c9cce3;
  opacity: 0.8;
}
.about-link {
  margin-top: auto;
  padding: 12px 12px 2px;
  font-size: 12px;
  color: rgba(201, 204, 227, 0.6);
  cursor: pointer;
}
.about-link:hover {
  color: #fff;
}
.app-content {
  height: 100%;
  overflow: auto;
  padding: 24px 28px;
}
</style>
