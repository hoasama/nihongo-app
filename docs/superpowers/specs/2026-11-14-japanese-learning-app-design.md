# Thiết kế: App học tiếng Nhật (Desktop) — Pha 0–1

- **Ngày:** 2026-11-14
- **Phạm vi spec này:** Pha 0 (nền móng + pipeline dữ liệu) và Pha 1 (Tra cứu + Nghe)
- **Loại:** App desktop cá nhân, offline-first

## 1. Mục tiêu

Một app desktop cá nhân giúp tự học tiếng Nhật trình độ JLPT **N5 → N4**, gồm 4 trụ cột: **tra cứu (từ vựng/kanji/ngữ pháp)**, **SRS flashcard**, **quiz**, **thống kê tiến độ**. Toàn bộ chạy **offline**, dữ liệu lưu cục bộ trên máy.

Spec này chỉ bao phủ **nền móng + tra cứu + nghe**. SRS (Pha 2), Quiz (Pha 3), Stats (Pha 4) sẽ có spec riêng, nhưng lược đồ CSDL ở đây được thiết kế sẵn để các pha sau mở rộng không phá vỡ.

## 2. Phạm vi

### Trong phạm vi (Pha 0–1)
- Scaffold app Tauri 2 + React 19 + TypeScript.
- Pipeline ETL biến dữ liệu mở (JMdict, KANJIDIC2, Tatoeba, list JLPT) thành 1 file `seed.sqlite` đóng gói theo app.
- Màn **Tra từ điển**: tìm theo kanji/kana/romaji/nghĩa, xem chi tiết từ (cách đọc, nghĩa, cấp JLPT, câu ví dụ).
- Màn **Kanji**: duyệt/tìm kanji theo cấp JLPT, xem âm on/kun, nghĩa, số nét, bộ thủ, từ chứa kanji đó.
- Màn **Ngữ pháp**: duyệt mẫu ngữ pháp N5/N4 (nội dung tiếng Việt), xem cấu trúc + giải thích + ví dụ.
- **Nghe (TTS):** nút phát âm mọi từ/câu tiếng Nhật qua Web Speech API (`ja-JP`).
- **Bookmark + ghi chú cá nhân** cho từ/kanji/ngữ pháp.
- Cài đặt cơ bản (chọn giọng TTS, tốc độ đọc, cỡ chữ, theme sáng/tối).

### Ngoài phạm vi (để pha sau)
- Flashcard SRS / thuật toán FSRS (Pha 2).
- Quiz engine (Pha 3).
- Dashboard thống kê & streak (Pha 4).
- Đồng bộ cloud, tài khoản, nhiều người dùng (không làm — đây là app cá nhân).
- Tự nhận diện chữ viết tay / luyện viết nét kanji.

## 3. Công nghệ

| Lớp | Lựa chọn | Ghi chú |
|-----|----------|---------|
| Vỏ app | **Tauri 2** | Lõi Rust, offline, đa nền tảng, bundle nhẹ |
| UI | **React 19 + TypeScript + Vite 6** | Quen thuộc, hệ sinh thái mạnh |
| Style | **Tailwind CSS v4 + shadcn/ui** | Component hiện đại, theme sáng/tối |
| Routing | **TanStack Router** | Type-safe, mới |
| Data fetching | **TanStack Query** | Cache truy vấn SQLite |
| State UI | **Zustand** | Nhẹ cho state giao diện (theme, settings) |
| CSDL | **SQLite** qua `@tauri-apps/plugin-sql` | Truy vấn nhanh dataset lớn |
| Nghe | **Web Speech API** (`SpeechSynthesis`) | Giọng `ja-JP` của hệ điều hành |
| ETL | **Node.js script (TypeScript)** | Chạy lúc build, sinh `seed.sqlite` |
| Test | **Vitest + React Testing Library** | Unit cho ETL + logic + component |

## 4. Nguồn dữ liệu & giấy phép

| Dữ liệu | Nguồn | Giấy phép | Dùng cho |
|---------|-------|-----------|----------|
| Từ điển Nhật–Anh | JMdict (EDRDG) | CC BY-SA 4.0 | Bảng `words`, `senses` |
| Kanji | KANJIDIC2 (EDRDG) | CC BY-SA 4.0 | Bảng `kanji` |
| Câu ví dụ | Tatoeba | CC BY 2.0 FR | Bảng `sentences` |
| List từ vựng N5/N4 | List cộng đồng (vd jlpt-vocab) | Xem từng repo | Gắn `jlpt_level`, tạo deck sau |
| Nghĩa tiếng Việt (N5/N4) | Biên soạn + deck VN cộng đồng | Ghi nguồn | Trường `gloss_vi` cho list JLPT |
| Ngữ pháp N5/N4 | Biên soạn dựa trên skill `japanese-n5-n4` (Minna/Marugoto) | Nội dung tự soạn | Bảng `grammar` |

**Lưu ý nội dung:**
- JMdict/KANJIDIC2 chỉ có nghĩa **tiếng Anh**. Nghĩa **tiếng Việt** chỉ phủ cho tập từ/kanji **N5/N4** (biên soạn thủ công hoặc nhập từ deck VN), phần còn lại hiển thị nghĩa tiếng Anh. Trường `gloss_vi` có thể `NULL`.
- JLPT **không công bố list chính thức** → dùng list cộng đồng, chấp nhận sai số nhỏ về phân cấp.
- Phải hiển thị **attribution** (EDRDG, Tatoeba) trong màn "Giới thiệu/Nguồn dữ liệu" để tuân thủ giấy phép.

## 5. Pipeline dữ liệu (Pha 0)

Script `scripts/build-seed/` (Node + TS) chạy **một lần lúc build**:

```
raw/ (JMdict.xml.gz, kanjidic2.xml.gz, sentences.csv, jlpt-lists/*.json)
  → parse + chuẩn hóa → ghi vào seed.sqlite → copy vào src-tauri/resources/
```

Các bước:
1. Tải/đặt file nguồn vào `scripts/build-seed/raw/` (không commit file lớn; có README hướng dẫn tải + checksum).
2. Parse XML (JMdict, KANJIDIC2) theo stream; parse CSV (Tatoeba).
3. Chuẩn hóa: tách kanji/kana, gộp nghĩa theo part-of-speech, gắn `jlpt_level` bằng cách đối chiếu list JLPT, lọc câu Tatoeba có bản dịch Anh.
4. Tạo index tìm kiếm (romaji hóa kana để tìm bằng romaji).
5. Ghi ra `seed.sqlite`, VACUUM, báo cáo số bản ghi.
6. Lần đầu app chạy: copy `seed.sqlite` (read-only reference) sang thư mục dữ liệu app; tạo file `user.sqlite` riêng cho dữ liệu người dùng (bookmark, ghi chú, sau này là card/review).

**Quyết định:** tách **2 file DB** — `seed.sqlite` (reference, thay được khi cập nhật data) và `user.sqlite` (dữ liệu người dùng, không bao giờ bị ghi đè khi update app). Truy vấn qua `ATTACH DATABASE`.

ETL phải **test được**: hàm transform thuần (XML node → record) kiểm bằng Vitest với fixture nhỏ, không cần file gốc đầy đủ.

## 6. Lược đồ CSDL

### `seed.sqlite` (read-only reference)
```sql
words(id, headword, reading_kana, reading_romaji, jlpt_level, is_common, freq_rank)
senses(id, word_id, part_of_speech, gloss_en, gloss_vi NULL, order_idx)
kanji(id, literal, grade, jlpt_level, stroke_count, radical,
      on_readings, kun_readings, meaning_en, meaning_vi NULL, freq_rank)
kanji_words(kanji_id, word_id)            -- liên kết kanji ↔ từ chứa nó
sentences(id, jp_text, translation_en, source)
sentence_words(sentence_id, word_id)      -- câu ví dụ cho từ (có thể rỗng ở Pha 1)
grammar(id, title, jlpt_level, structure, meaning_vi, explanation_vi, examples_json)
-- FTS5 cho tìm kiếm nhanh:
words_fts(headword, reading_kana, reading_romaji, gloss_en, gloss_vi)
```

### `user.sqlite` (writable)
```sql
settings(key, value)                      -- tts_voice, tts_rate, theme, font_size...
bookmarks(id, item_type, item_id, created_at)   -- item_type: word|kanji|grammar
notes(id, item_type, item_id, body, updated_at)
-- (Pha 2 sẽ thêm: decks, cards, reviews. Pha 4: study_sessions, stats.)
```

**Quyết định:** dùng **FTS5** của SQLite cho ô tìm kiếm (match kanji/kana/romaji/nghĩa) — đủ nhanh, không cần thư viện search ngoài.

## 7. Kiến trúc app

```
src/
├─ app/            # khởi tạo router, provider (Query, theme), layout
├─ db/             # mở kết nối, ATTACH, các hàm query (repository)
│   ├─ client.ts         # getDb(): attach seed + user
│   ├─ words.repo.ts     # searchWords, getWordDetail
│   ├─ kanji.repo.ts
│   ├─ grammar.repo.ts
│   └─ user.repo.ts      # bookmarks, notes, settings
├─ features/
│   ├─ dictionary/   # màn tra từ + chi tiết từ
│   ├─ kanji/        # màn kanji + chi tiết
│   ├─ grammar/      # màn ngữ pháp + chi tiết
│   └─ settings/
├─ shared/
│   ├─ tts/          # useSpeak() bọc SpeechSynthesis
│   ├─ ui/           # component shadcn dùng chung
│   └─ types.ts
└─ main.tsx
```

**Ranh giới rõ ràng:** mỗi `*.repo.ts` là cổng truy cập DB duy nhất của feature đó (feature không viết SQL trực tiếp trong component). TTS gói gọn trong `useSpeak()` để component không đụng API trình duyệt.

## 8. Tính năng Pha 1 (chi tiết)

### 8.1 Tra từ điển
- Ô tìm: nhập kanji/kana/romaji/nghĩa → kết quả gợi ý (debounce, dùng `words_fts`).
- Lọc theo cấp JLPT (N5/N4/khác).
- Trang chi tiết từ: headword + furigana, cách đọc, danh sách nghĩa theo loại từ, cờ "thông dụng", nút 🔊 đọc từ, câu ví dụ (có nút 🔊), nút bookmark + ô ghi chú.

### 8.2 Kanji
- Lưới kanji lọc theo cấp JLPT; tìm theo literal/nghĩa.
- Chi tiết: kanji lớn, âm on/kun, nghĩa, số nét, bộ thủ, danh sách từ chứa kanji (link sang từ điển), nút 🔊, bookmark, ghi chú.

### 8.3 Ngữ pháp
- Danh sách mẫu ngữ pháp theo cấp (N5 trước, N4 sau), tìm theo tiêu đề.
- Chi tiết: cấu trúc (vd `V-て + ください`), nghĩa tiếng Việt, giải thích, 2–4 ví dụ (câu Nhật + dịch + nút 🔊), bookmark, ghi chú.

### 8.4 Nghe (TTS)
- `useSpeak(text)`: chọn giọng `ja-JP` (ưu tiên giọng người dùng chọn trong Settings), áp tốc độ đã cấu hình.
- Nếu máy **không có giọng `ja-JP`** → nút 🔊 hiện tooltip hướng dẫn cài gói giọng tiếng Nhật của HĐH, không làm app lỗi.

## 9. Điều hướng / UI

- Sidebar trái: **Tra từ · Kanji · Ngữ pháp · Đã lưu · Cài đặt**.
- Header: ô tìm kiếm toàn cục + nút chuyển theme.
- Theme sáng/tối (Tailwind + shadcn), cỡ chữ chỉnh được (kanji cần đọc rõ).
- Trạng thái rỗng rõ ràng (chưa nhập / không có kết quả / DB đang nạp lần đầu).

## 10. Xử lý lỗi

- **Thiếu `seed.sqlite`** lúc khởi động → màn báo lỗi + nút "nạp lại từ resources".
- **Lỗi mở DB** → thông báo thân thiện, log ra file, không crash trắng màn hình.
- **Query lỗi** → TanStack Query bắt lỗi, hiện retry; không làm sập cả app.
- **Không có giọng TTS** → degrade nhẹ như mục 8.4.

## 11. Kiểm thử

- **ETL:** unit test (Vitest) cho hàm transform với fixture XML/CSV nhỏ — đảm bảo mapping đúng.
- **Repository:** test query trên 1 SQLite tạm seed vài bản ghi (tìm kiếm, lọc JLPT, bookmark CRUD).
- **Component:** React Testing Library cho ô tìm (debounce, render kết quả), nút TTS (mock `speechSynthesis`), trang chi tiết.
- **Smoke:** app build Tauri mở được, 3 màn chính render.

## 12. Cột mốc (Pha 0–1)

1. **M0** — Scaffold Tauri 2 + React + Tailwind/shadcn + router chạy được "hello".
2. **M1** — Pipeline ETL sinh `seed.sqlite` từ fixture nhỏ, có test; rồi chạy full data.
3. **M2** — Lớp `db/` + repository + ATTACH 2 DB.
4. **M3** — Màn Tra từ điển + chi tiết + TTS.
5. **M4** — Màn Kanji + chi tiết.
6. **M5** — Màn Ngữ pháp (nạp nội dung N5 trước) + chi tiết.
7. **M6** — Bookmark + ghi chú + Settings + màn "Nguồn dữ liệu/attribution".

## 13. Rủi ro & cách giảm

- **Thiếu nghĩa tiếng Việt diện rộng:** chấp nhận N5/N4 có `gloss_vi`, phần khác tiếng Anh; bổ sung dần.
- **Phân cấp JLPT không chính thức:** ghi chú trong app là "theo list cộng đồng".
- **Kích thước data lớn:** đóng gói `seed.sqlite` đã nén; đo dung lượng ở M1 để quyết có cần giảm tập câu ví dụ.
- **Giọng TTS phụ thuộc HĐH:** đã có fallback; ghi rõ trong README cách cài giọng tiếng Nhật.
