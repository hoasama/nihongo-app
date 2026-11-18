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

const base = "rounded-lg px-3 py-2 text-sm transition-colors";
const activeCls = "bg-accent font-semibold text-white";
const idleCls = "text-[var(--side-text)] hover:bg-white/10";

function isActive(item: { to: string; exact: boolean }) {
  return item.exact ? route.path === "/" : route.path.startsWith(item.to);
}
</script>

<template>
  <div class="flex h-full bg-bg text-ink">
    <aside
      class="w-52 shrink-0 bg-side p-4 text-[var(--side-text)]"
    >
      <div class="mb-5 px-2">
        <h1 class="jp text-2xl font-bold text-white">日本語</h1>
        <p class="text-xs text-[var(--side-text)]">Nihongo · N5 / N4</p>
      </div>
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[base, isActive(item) ? activeCls : idleCls]"
        >
          {{ item.label }}
        </RouterLink>

        <p class="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--side-text)]/60">
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
        class="mt-6 block px-2 text-xs text-[var(--side-text)]/60 hover:text-white"
      >
        Nguồn dữ liệu
      </RouterLink>
    </aside>
    <main class="flex-1 overflow-auto bg-bg p-8">
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>
