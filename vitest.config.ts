import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

// Mặc định jsdom cho test component; test ETL (scripts/**) khai báo
// `// @vitest-environment node` ở đầu file để chạy môi trường Node.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
  },
});
