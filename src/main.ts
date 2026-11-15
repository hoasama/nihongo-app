import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";
import App from "./App.vue";
import { router } from "./app/router";
import { useSettings } from "./shared/settingsStore";
import "./index.css";

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(router);
app.mount("#root");

// Nạp cài đặt (theme, cỡ chữ, TTS) từ DB rồi áp dụng.
void useSettings().load();
