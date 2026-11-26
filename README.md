# japanese-app

Ứng dụng desktop học tiếng Nhật (N5–N3): tra từ, kanji, ngữ pháp, luyện đọc, và ôn tập theo SRS.

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

## Cài đặt trên máy mới

1. **Cài Node.js 22.5 trở lên** (đang dùng 24.x). `build:seed` và test cần `node:sqlite`.
2. **Có file `resources/seed.sqlite`** (~88MB, không nằm trong git). Lấy theo một trong hai cách:
   - Chép từ máy đang chạy được (gói zip "kèm seed" đã có sẵn file này).
   - Hoặc dựng lại: đặt dữ liệu nguồn vào `scripts/build-seed/raw/` (xem [README ở đó](scripts/build-seed/raw/README.md)), chạy `npm run build:seed`, rồi chép `scripts/build-seed/seed.sqlite` sang `resources/seed.sqlite`.
3. **Cài thư viện.** Dùng `--ignore-scripts` để `better-sqlite3` không biên dịch lại (máy không có Visual Studio sẽ lỗi node-gyp; bản dựng sẵn vẫn chạy tốt), rồi tải Electron riêng:
   ```powershell
   npm install --ignore-scripts
   node node_modules/electron/install.js
   ```
4. **Chạy và kiểm tra:**
   ```powershell
   npm run dev
   npm test
   ```

Không đi theo source (chép tay nếu cần):

- **Tiến độ học** (lịch ôn, bookmark, ghi chú) nằm trong `user.sqlite`: bản `.exe` ở `%APPDATA%\japanese-app\`, bản dev ở `%APPDATA%\Electron\`. Chép khi app đang tắt.
- **API key LLM** (Luyện đọc) lưu trong localStorage của app, cần nhập lại.
- **Giọng đọc tiếng Nhật:** Windows cần cài giọng ja-JP (Settings → Time & Language → Speech), không thì nút nghe không có tiếng.

## Chạy dự án

```bash
npm run dev     # Vite + Electron (dev)
npm run app     # build rồi chạy bản Electron (hoặc bấm đúp start-nihongo.cmd)
npm test        # chạy test
npm run dist    # đóng gói file .exe portable vào release/
```

## Script khác

- `npm run build` — build web (vue-tsc + vite)
- `npm run build:seed` — dựng lại file seed SQLite từ dữ liệu nguồn
