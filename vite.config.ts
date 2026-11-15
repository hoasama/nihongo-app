import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base './' để asset dùng đường dẫn tương đối khi Electron load qua file://
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  server: {
    port: 1420,
    strictPort: true,
  },
});
