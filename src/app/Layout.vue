<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";

const route = useRoute();

const nav = [
  { to: "/", label: "Tra từ", exact: true },
  { to: "/kanji", label: "Kanji", exact: false },
  { to: "/grammar", label: "Ngữ pháp", exact: false },
];
const reviewNav = [
  { to: "/review/vocab", label: "Từ vựng", exact: false },
  { to: "/review/kanji", label: "Kanji", exact: false },
];
const nav2 = [
  { to: "/saved", label: "Đã lưu", exact: false },
  { to: "/settings", label: "Cài đặt", exact: false },
];

const base = "rounded px-2 py-1.5 text-sm";
const activeCls = "bg-slate-200 font-medium dark:bg-slate-800";
const idleCls = "hover:bg-slate-200 dark:hover:bg-slate-800";

function isActive(item: { to: string; exact: boolean }) {
  return item.exact ? route.path === "/" : route.path.startsWith(item.to);
}
</script>

<template>
  <div class="flex h-full text-slate-900 dark:text-slate-100">
    <aside
      class="w-48 shrink-0 border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <h1 class="mb-4 px-2 text-lg font-bold">日本語</h1>
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[base, isActive(item) ? activeCls : idleCls]"
        >
          {{ item.label }}
        </RouterLink>

        <p class="mt-3 px-2 text-xs font-semibold uppercase text-slate-400">
          Ôn tập
        </p>
        <RouterLink
          v-for="item in reviewNav"
          :key="item.to"
          :to="item.to"
          :class="[base, 'ml-2', isActive(item) ? activeCls : idleCls]"
        >
          {{ item.label }}
        </RouterLink>

        <div class="mt-3 flex flex-col gap-1">
          <RouterLink
            v-for="item in nav2"
            :key="item.to"
            :to="item.to"
            :class="[base, isActive(item) ? activeCls : idleCls]"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
      <RouterLink
        to="/about"
        class="mt-6 block px-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        Nguồn dữ liệu
      </RouterLink>
    </aside>
    <main class="flex-1 overflow-auto bg-white p-6 dark:bg-slate-950">
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>
