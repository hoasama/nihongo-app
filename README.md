# japanese-app

Ứng dụng desktop học tiếng Nhật (N5–N4): tra từ, kanji, ngữ pháp, và ôn tập theo SRS.

## Công nghệ sử dụng

- **Vue 3** + **Vue Router** + **Pinia** (state)
- **antdv-next** (Ant Design Vue) + bộ icon đi kèm
- **@tanstack/vue-query** cho data fetching
- **Tailwind CSS** v4
- **Electron** làm vỏ desktop
- **Vite** + **TypeScript** (type-check bằng `vue-tsc`)
- **SQLite** (`better-sqlite3` + Node experimental sqlite) cho dữ liệu từ/kanji/ngữ pháp
- **Vitest** + Testing Library (Vue) cho test
- `wanakana` (chuyển kana/romaji), `fast-xml-parser` (dựng seed từ JMdict/KANJIDIC)

## Chạy dự án

```bash
npm install
npm run dev     # Vite + Electron (dev)
npm run app     # build rồi chạy bản Electron
npm test        # chạy test
```

## Script khác

- `npm run build` — build web (vue-tsc + vite)
- `npm run build:seed` — dựng lại file seed SQLite từ dữ liệu nguồn
