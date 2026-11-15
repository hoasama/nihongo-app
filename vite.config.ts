import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// base './' để asset dùng đường dẫn tương đối khi Electron load qua file://
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: "./",
  server: {
    port: 1420,
    strictPort: true,
  },
});
