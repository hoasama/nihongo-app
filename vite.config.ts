import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// base './' để asset dùng đường dẫn tương đối khi Electron load qua file://
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: "./",
  server: {
    // bind IPv4 để khớp wait-on tcp:127.0.0.1:1420 trong script dev:electron
    // (mặc định Vite bind localhost = ::1, khiến wait-on treo → Electron không mở)
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
});
