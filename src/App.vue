<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import Layout from "./app/Layout.vue";
import { useSettings } from "./shared/settingsStore";
import { antdThemeConfig } from "./app/antdTheme";

const { theme } = storeToRefs(useSettings());
const themeConfig = computed(() => antdThemeConfig(theme.value));
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <a-app class="h-full">
      <Layout />
    </a-app>
  </a-config-provider>
</template>
