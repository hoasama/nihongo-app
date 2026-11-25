import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";
import Antdv from "antdv-next";
import App from "./App.vue";
import { router } from "./app/router";
import { useSettings } from "./shared/settingsStore";
import { getDb } from "./db/client";
import { ensurePresetDecks } from "./db/srs.repo";
import "./index.css";

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(Antdv);
app.use(router);
app.mount("#root");

// Nạp cài đặt rồi tạo preset deck (idempotent).
void (async () => {
  await useSettings().load();
  if (typeof window !== "undefined" && window.db) {
    await ensurePresetDecks(getDb());
  }
})();
