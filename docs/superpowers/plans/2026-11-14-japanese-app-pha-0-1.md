# App học tiếng Nhật — Plan triển khai Pha 0–1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng app desktop offline học tiếng Nhật N5/N4 với 3 màn tra cứu (từ điển, kanji, ngữ pháp), nghe bằng TTS, và pipeline ETL sinh CSDL SQLite từ dữ liệu mở.

**Architecture:** Vỏ Tauri 2 (Rust) bọc UI React 19. Dữ liệu reference nằm trong `seed.sqlite` (sinh bởi ETL lúc build), dữ liệu người dùng trong `user.sqlite`; truy cập qua lớp repository, không viết SQL trong component. TTS gói trong hook `useSpeak`.

**Tech Stack:** Tauri 2, React 19 + TypeScript, Vite 6, Tailwind v4 + shadcn/ui, TanStack Router + Query, Zustand, `@tauri-apps/plugin-sql` (SQLite + FTS5), Vitest + React Testing Library, Node/TS ETL.

---

## Cấu trúc file (khóa quyết định phân rã)

```
japanese-app/
├─ scripts/build-seed/          # ETL (Node+TS) → seed.sqlite
│  ├─ src/parseJmdict.ts        # XML entry → WordRecord[]
│  ├─ src/parseKanjidic.ts      # XML char → KanjiRecord
│  ├─ src/parseTatoeba.ts       # CSV row → SentenceRecord
│  ├─ src/jlptLevels.ts         # gắn jlpt_level từ list cộng đồng
│  ├─ src/schema.sql            # DDL seed.sqlite (bảng + FTS5)
│  ├─ src/buildSeed.ts          # orchestrator ghi seed.sqlite
│  ├─ raw/                      # file nguồn (gitignore) + README tải
│  └─ tests/*.test.ts           # Vitest cho hàm transform
├─ src/                         # React
│  ├─ app/{router.tsx,providers.tsx,Layout.tsx}
│  ├─ db/{client.ts,words.repo.ts,kanji.repo.ts,grammar.repo.ts,user.repo.ts}
│  ├─ features/dictionary/{DictionaryPage.tsx,WordDetail.tsx}
│  ├─ features/kanji/{KanjiPage.tsx,KanjiDetail.tsx}
│  ├─ features/grammar/{GrammarPage.tsx,GrammarDetail.tsx}
│  ├─ features/settings/SettingsPage.tsx
│  ├─ shared/tts/useSpeak.ts
│  ├─ shared/ui/…               # shadcn
│  └─ shared/types.ts
├─ src-tauri/                   # Rust shell + resources/seed.sqlite
└─ docs/superpowers/…
```

---

## M0 — Scaffold & xác minh toolchain

### Task 0: Xác minh toolchain Tauri build được trên máy này

**Files:** không (chỉ kiểm tra môi trường)

- [ ] **Step 1: Kiểm Rust + Node**

Run:
```powershell
rustc --version; cargo --version; node --version; npm --version
```
Expected: in ra version. Nếu thiếu Rust → cài qua `winget install Rustlang.Rustup` rồi `rustup default stable`.

- [ ] **Step 2: Kiểm MSVC build tools**

Run: `cargo new _probe; cd _probe; cargo build; cd ..; rmdir /s /q _probe` (PowerShell: `Remove-Item -Recurse -Force _probe`).
Expected: build thành công. Nếu lỗi `link.exe not found` → cài "Desktop development with C++" (Visual Studio Build Tools).

- [ ] **Step 3: Cảnh báo Smart App Control**

Nếu `cargo build` hoặc chạy app bị chặn bởi Smart App Control (ENFORCED trên máy này), DỪNG và báo người dùng: cần chuyển SAC sang Evaluation/Off trong Windows Security → "App & browser control". Không workaround ngầm.

### Task 1: Scaffold Tauri 2 + React + Vite

**Files:**
- Create: toàn bộ scaffold trong `d:\Stack\project\japanese-app` (đã có `docs/`, giữ nguyên)

- [ ] **Step 1: Tạo scaffold vào thư mục hiện có**

Run (trong `d:\Stack\project\japanese-app`):
```powershell
npm create tauri-app@latest . -- --template react-ts --manager npm --yes
```
Nếu công cụ từ chối ghi vào thư mục không rỗng: scaffold ra `../japanese-app-tmp` rồi copy đè (giữ `docs/` và `.git/`).

- [ ] **Step 2: Cài deps**

Run: `npm install`

- [ ] **Step 3: Chạy thử dev**

Run: `npm run tauri dev`
Expected: cửa sổ app mở, hiện trang mặc định. Đóng lại.

- [ ] **Step 4: Thêm .gitignore cho raw data + build**

Tạo/sửa `.gitignore` thêm: `scripts/build-seed/raw/`, `scripts/build-seed/*.sqlite`, `src-tauri/resources/seed.sqlite`, `node_modules`, `dist`, `src-tauri/target`.

- [ ] **Step 5: Commit**

```powershell
git add -A; git commit -m "chore: scaffold Tauri 2 + React + Vite"
```

### Task 2: Thêm Tailwind v4 + shadcn + router + query

**Files:**
- Create: `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/Layout.tsx`
- Modify: `src/main.tsx`, `src/index.css`, `vite.config.ts`

- [ ] **Step 1: Cài thư viện**

Run:
```powershell
npm install @tanstack/react-router @tanstack/react-query zustand @tauri-apps/plugin-sql
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Bật Tailwind v4 qua plugin Vite**

`vite.config.ts`: thêm `import tailwindcss from '@tailwindcss/vite'` vào `plugins: [react(), tailwindcss()]`.
`src/index.css` đầu file: `@import "tailwindcss";`

- [ ] **Step 3: Providers + Layout tối thiểu**

`src/app/providers.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
const qc = new QueryClient();
export function Providers({ children }: PropsWithChildren) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```
`src/app/Layout.tsx`: sidebar với link `Tra từ / Kanji / Ngữ pháp / Đã lưu / Cài đặt` + `<Outlet/>`.
`src/app/router.tsx`: tạo router TanStack với các route rỗng (render tên màn). Wire vào `src/main.tsx` bọc `<Providers>`.

- [ ] **Step 4: Chạy dev kiểm điều hướng**

Run: `npm run tauri dev` → bấm qua 5 mục, mỗi mục hiện tên. Đóng.

- [ ] **Step 5: Commit**

```powershell
git add -A; git commit -m "feat: layout, routing, tailwind, query providers"
```

---

## M1 — Pipeline ETL → seed.sqlite

### Task 3: DDL schema seed.sqlite

**Files:**
- Create: `scripts/build-seed/src/schema.sql`

- [ ] **Step 1: Viết DDL** theo spec §6 (bảng `words, senses, kanji, kanji_words, sentences, sentence_words, grammar` + `words_fts` FTS5). Dùng `CREATE VIRTUAL TABLE words_fts USING fts5(headword, reading_kana, reading_romaji, gloss_en, gloss_vi, content='');`.

- [ ] **Step 2: Commit**

```powershell
git add scripts/build-seed/src/schema.sql; git commit -m "feat(etl): schema seed.sqlite"
```

### Task 4: Parse JMdict (TDD)

**Files:**
- Create: `scripts/build-seed/src/parseJmdict.ts`, `scripts/build-seed/tests/parseJmdict.test.ts`
- Create fixture: `scripts/build-seed/tests/fixtures/jmdict-sample.xml`

- [ ] **Step 1: Fixture nhỏ** — 1 `<entry>` có `<keb>食べる</keb>`, `<reb>たべる</reb>`, `<sense><pos>v1</pos><gloss>to eat</gloss></sense>`.

- [ ] **Step 2: Test thất bại**

```ts
import { describe, it, expect } from 'vitest';
import { parseJmdictEntry } from '../src/parseJmdict';
import { readFileSync } from 'node:fs';
it('parse 1 entry thành WordRecord', () => {
  const xml = readFileSync(__dirname + '/fixtures/jmdict-sample.xml', 'utf8');
  const recs = parseJmdictEntry(xml);
  expect(recs[0].headword).toBe('食べる');
  expect(recs[0].reading_kana).toBe('たべる');
  expect(recs[0].senses[0].gloss_en).toBe('to eat');
});
```

- [ ] **Step 3: Chạy test → FAIL** `Run: npx vitest run scripts/build-seed/tests/parseJmdict.test.ts` (chưa có hàm).

- [ ] **Step 4: Cài parser XML** `npm i -D fast-xml-parser` và viết `parseJmdictEntry(xml): WordRecord[]` dùng `XMLParser`, map keb/reb/sense. Định nghĩa type `WordRecord`, `SenseRecord` trong cùng file (export).

- [ ] **Step 5: Chạy test → PASS**

- [ ] **Step 6: Commit** `git add -A; git commit -m "feat(etl): parse JMdict entries"`

### Task 5: Parse KANJIDIC2 (TDD)

**Files:**
- Create: `scripts/build-seed/src/parseKanjidic.ts`, `tests/parseKanjidic.test.ts`, `tests/fixtures/kanjidic-sample.xml`

- [ ] **Step 1: Fixture** 1 `<character>`: literal `日`, `<stroke_count>4`, on `ニチ`, kun `ひ`, meaning `day`.

- [ ] **Step 2: Test thất bại** kiểm `literal='日'`, `stroke_count=4`, `on_readings` chứa `ニチ`, `meaning_en` chứa `day`.

- [ ] **Step 3: FAIL** `npx vitest run scripts/build-seed/tests/parseKanjidic.test.ts`

- [ ] **Step 4: Viết `parseKanjidicChar`** (XMLParser, tách reading on/kun theo `r_type`, gộp meaning `m_lang` rỗng = Anh). Export type `KanjiRecord`.

- [ ] **Step 5: PASS** → **Step 6: Commit** `feat(etl): parse KANJIDIC2`

### Task 6: Parse Tatoeba + gắn JLPT level (TDD)

**Files:**
- Create: `scripts/build-seed/src/parseTatoeba.ts`, `src/jlptLevels.ts`, test + fixtures tương ứng.

- [ ] **Step 1: Test parseTatoeba** — input 2 dòng CSV tab (`id<TAB>jpn<TAB>text`) → `SentenceRecord[]` đúng `jp_text`. FAIL → viết hàm split tab, lọc `lang==='jpn'` → PASS.

- [ ] **Step 2: Test jlptLevels** — `assignLevel('日', {N5:['日']})` trả `'N5'`, từ không có trong list trả `null`. FAIL → viết hàm tra map → PASS.

- [ ] **Step 3: Commit** `feat(etl): parse Tatoeba + gán JLPT level`

### Task 7: Orchestrator buildSeed + README tải data

**Files:**
- Create: `scripts/build-seed/src/buildSeed.ts`, `scripts/build-seed/raw/README.md`
- Modify: `package.json` (script `build:seed`)

- [ ] **Step 1: README tải data** — ghi URL tải JMdict_e.gz, kanjidic2.xml.gz, Tatoeba `sentences.csv`, list JLPT; nơi đặt (`raw/`); ghi chú giấy phép EDRDG/Tatoeba.

- [ ] **Step 2: buildSeed.ts** — dùng `better-sqlite3` (`npm i -D better-sqlite3`): tạo DB từ `schema.sql`, stream parse từng nguồn, insert theo transaction, fill `words_fts` (romaji hóa kana bằng thư viện `wanakana` — `npm i -D wanakana`), VACUUM, in thống kê số bản ghi. Ghi ra `scripts/build-seed/seed.sqlite`.

- [ ] **Step 3: Thêm script** `package.json`: `"build:seed": "tsx scripts/build-seed/src/buildSeed.ts"` (`npm i -D tsx`).

- [ ] **Step 4: Chạy với fixture trước** — tạm trỏ raw sang fixtures nhỏ, `npm run build:seed`, xác nhận ra file .sqlite + đếm >0 bản ghi.

- [ ] **Step 5: Chạy full data** (nếu đã tải) → đo dung lượng seed.sqlite, báo cáo.

- [ ] **Step 6: Copy seed vào resources** `src-tauri/resources/seed.sqlite`; khai báo trong `tauri.conf.json` `bundle.resources`.

- [ ] **Step 7: Commit** `feat(etl): orchestrator build seed.sqlite + README nguồn data` (KHÔNG commit file .sqlite/raw).

---

## M2 — Lớp DB + repository

### Task 8: db/client.ts — mở & ATTACH 2 DB

**Files:**
- Create: `src/db/client.ts`

- [ ] **Step 1: Cài plugin-sql phía Rust** — `src-tauri/Cargo.toml` thêm `tauri-plugin-sql = { version = "2", features = ["sqlite"] }`; `src-tauri/src/lib.rs` `.plugin(tauri_plugin_sql::Builder::default().build())`.

- [ ] **Step 2: client.ts** — hàm `getDb()`: lần đầu copy `seed.sqlite` từ resources sang appDataDir (dùng `@tauri-apps/api/path` + `@tauri-apps/plugin-fs`), mở `user.sqlite` (tạo nếu chưa có, chạy DDL user tables từ string), `ATTACH` seed. Trả `Database` singleton.

- [ ] **Step 3: DDL user tables** inline: `settings, bookmarks, notes` theo spec §6.

- [ ] **Step 4: Commit** `feat(db): client mở + attach seed/user DB`

### Task 9: words.repo.ts (TDD với SQLite tạm)

**Files:**
- Create: `src/db/words.repo.ts`, `src/db/__tests__/words.repo.test.ts`

- [ ] **Step 1: Test** dùng `better-sqlite3` tạo DB tạm seed 2 từ, gọi `searchWords(db,'たべ')` trả từ `食べる`; `getWordDetail(db,id)` trả kèm senses. (Repo nhận interface query tối giản để test được không cần Tauri.)

- [ ] **Step 2: FAIL** `npx vitest run src/db/__tests__/words.repo.test.ts`

- [ ] **Step 3: Viết repo** — `searchWords` dùng `words_fts MATCH`, lọc jlpt optional; `getWordDetail` JOIN senses + sentences. Trả type từ `shared/types.ts`.

- [ ] **Step 4: PASS → Commit** `feat(db): words repository + search`

### Task 10: kanji.repo.ts + grammar.repo.ts + user.repo.ts (TDD)

**Files:** Create 3 repo + test tương ứng.

- [ ] **Step 1: kanji.repo** — test `searchKanji`, `listByLevel('N5')`, `getKanjiDetail` (kèm từ chứa kanji). FAIL → implement → PASS.
- [ ] **Step 2: grammar.repo** — test `listGrammar('N5')`, `getGrammarDetail` (parse `examples_json`). FAIL → implement → PASS.
- [ ] **Step 3: user.repo** — test `addBookmark/removeBookmark/isBookmarked`, `getNote/saveNote`, `getSetting/setSetting`. FAIL → implement → PASS.
- [ ] **Step 4: Commit** `feat(db): kanji/grammar/user repositories`

---

## M3 — Màn Tra từ điển + TTS

### Task 11: useSpeak hook (TDD)

**Files:** Create `src/shared/tts/useSpeak.ts`, `src/shared/tts/__tests__/useSpeak.test.ts`

- [ ] **Step 1: Test** — mock `window.speechSynthesis` + `SpeechSynthesisUtterance`; gọi `speak('こんにちは')` → `speechSynthesis.speak` được gọi với utterance `lang==='ja-JP'`. Khi không có `ja-JP` voice → trả `{ supported:false }`.

- [ ] **Step 2: FAIL** `npx vitest run src/shared/tts/__tests__/useSpeak.test.ts`

- [ ] **Step 3: Implement** `useSpeak()` trả `{ speak, supported }`; đọc rate/voice từ settings (tham số), chọn voice `ja-JP`.

- [ ] **Step 4: PASS → Commit** `feat(tts): useSpeak hook`

### Task 12: DictionaryPage — ô tìm debounce (TDD)

**Files:** Create `src/features/dictionary/DictionaryPage.tsx` + test, `src/shared/useDebounce.ts` + test.

- [ ] **Step 1: Test useDebounce** — giá trị cập nhật sau delay (dùng fake timers). FAIL → implement → PASS.

- [ ] **Step 2: Test DictionaryPage** — render với repo mock trả 1 kết quả; gõ vào input → sau debounce hiện headword. Dùng RTL + `userEvent`. FAIL.

- [ ] **Step 3: Implement** — input + `useQuery(['words',q], () => searchWords(...))`, list kết quả link sang detail, filter JLPT, empty states.

- [ ] **Step 4: PASS → Commit** `feat(dictionary): trang tra từ + debounce`

### Task 13: WordDetail

**Files:** Create `src/features/dictionary/WordDetail.tsx` (+ smoke test render).

- [ ] **Step 1: Test smoke** — render với word mock → hiện headword, nghĩa, nút 🔊; click 🔊 gọi `speak` (mock). FAIL.
- [ ] **Step 2: Implement** — hiển thị furigana/reading, senses theo pos, cờ thông dụng, câu ví dụ (mỗi câu có 🔊), nút bookmark (user.repo), ô ghi chú (lưu debounce).
- [ ] **Step 3: PASS → Commit** `feat(dictionary): trang chi tiết từ + bookmark/ghi chú`

---

## M4 — Màn Kanji

### Task 14: KanjiPage + KanjiDetail

**Files:** Create `src/features/kanji/KanjiPage.tsx`, `KanjiDetail.tsx` + test.

- [ ] **Step 1: Test KanjiPage** — render lưới với kanji mock lọc theo N5; tìm theo literal. FAIL → implement (lưới + filter level + search) → PASS.
- [ ] **Step 2: Test KanjiDetail** — render → literal lớn, on/kun, số nét, bộ thủ, danh sách từ chứa (link), 🔊, bookmark. FAIL → implement → PASS.
- [ ] **Step 3: Commit** `feat(kanji): trang danh sách + chi tiết kanji`

---

## M5 — Màn Ngữ pháp

### Task 15: Nội dung ngữ pháp N5 (seed)

**Files:** Create `scripts/build-seed/content/grammar-n5.json`

- [ ] **Step 1: Soạn 10–15 mẫu N5 đầu** dựa trên skill `japanese-n5-n4` (mỗi mục: `title, jlpt_level:'N5', structure, meaning_vi, explanation_vi, examples:[{jp,vi}]`). Đủ để kiểm màn; bổ sung dần sau.

- [ ] **Step 2: Nạp vào buildSeed** — `buildSeed.ts` đọc file JSON này insert bảng `grammar`. Chạy lại `npm run build:seed` (fixture) xác nhận có bản ghi grammar.

- [ ] **Step 3: Commit** `content(grammar): bộ mẫu N5 khởi đầu + nạp vào ETL`

### Task 16: GrammarPage + GrammarDetail

**Files:** Create `src/features/grammar/GrammarPage.tsx`, `GrammarDetail.tsx` + test.

- [ ] **Step 1: Test GrammarPage** — list theo N5, tìm theo title. FAIL → implement → PASS.
- [ ] **Step 2: Test GrammarDetail** — hiện structure, meaning_vi, explanation, ví dụ (🔊 mỗi câu), bookmark/ghi chú. FAIL → implement → PASS.
- [ ] **Step 3: Commit** `feat(grammar): trang danh sách + chi tiết ngữ pháp`

---

## M6 — Đã lưu + Settings + Nguồn dữ liệu

### Task 17: Trang "Đã lưu" (bookmarks tổng hợp)

**Files:** Create `src/features/saved/SavedPage.tsx` + test.

- [ ] **Step 1: Test** — repo mock trả bookmark 3 loại → render nhóm Word/Kanji/Grammar, click điều hướng. FAIL → implement → PASS.
- [ ] **Step 2: Commit** `feat(saved): trang mục đã lưu`

### Task 18: SettingsPage + store Zustand

**Files:** Create `src/features/settings/SettingsPage.tsx`, `src/shared/settingsStore.ts` + test.

- [ ] **Step 1: Test store** — set `ttsRate`, `theme`, persist qua user.repo (mock). FAIL → implement → PASS.
- [ ] **Step 2: SettingsPage** — chọn giọng TTS (liệt kê voices `ja-JP`), tốc độ đọc, theme sáng/tối, cỡ chữ. Áp theme vào `<html>` class.
- [ ] **Step 3: Commit** `feat(settings): cài đặt TTS/theme/cỡ chữ`

### Task 19: Trang Nguồn dữ liệu (attribution) + hoàn thiện

**Files:** Create `src/features/about/AboutPage.tsx`.

- [ ] **Step 1: Attribution** — ghi rõ JMdict/KANJIDIC2 © EDRDG (CC BY-SA), Tatoeba (CC BY), lưu ý JLPT list cộng đồng. Thêm link menu.
- [ ] **Step 2: Chạy toàn bộ test** `Run: npx vitest run` → tất cả PASS.
- [ ] **Step 3: Build app** `Run: npm run tauri build` → tạo installer, mở thử 3 màn chính.
- [ ] **Step 4: Commit** `feat(about): trang nguồn dữ liệu + hoàn thiện Pha 0-1`

---

## Self-review (đã rà so với spec)

- **Spec §2 tra từ/kanji/ngữ pháp:** Task 12–16 ✓ · **TTS §8.4:** Task 11 + nút 🔊 ở detail ✓ · **Bookmark/ghi chú:** Task 10/13/17 ✓ · **Settings §9:** Task 18 ✓ · **Attribution §4:** Task 19 ✓
- **ETL §5 + schema §6:** Task 3–7 ✓ · **2 DB + ATTACH:** Task 8 ✓ · **FTS5 search:** Task 7 (fill) + Task 9 (MATCH) ✓
- **Test §11:** ETL transforms (4–6), repository (9–10), component/TTS (11–16,18) ✓
- **Rủi ro toolchain/SAC:** Task 0 chặn sớm ✓
- Tên hàm nhất quán: `searchWords/getWordDetail/searchKanji/listByLevel/getKanjiDetail/listGrammar/getGrammarDetail/addBookmark/getSetting/useSpeak`.
```
