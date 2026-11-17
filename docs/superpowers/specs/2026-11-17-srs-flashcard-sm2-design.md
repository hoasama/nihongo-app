# Thiết kế: SRS Flashcard (Anki-in-app, SM-2) — Pha 2

- **Ngày:** 2026-11-17
- **Phạm vi spec này:** Màn **"Học"** — ôn tập lặp lại ngắt quãng (spaced repetition) ngay trong app cho **Từ vựng + Kanji** (N5/N4 + mục Đã lưu).
- **Loại:** App desktop cá nhân, offline-first (Electron + Vue 3 + Tailwind, better-sqlite3 qua IPC).

## 1. Mục tiêu

Biến app từ "từ điển tra cứu" thành **công cụ học thật sự**: người dùng ôn thẻ đến hạn mỗi ngày, app tự xếp lịch ôn lại theo trí nhớ (thuật toán SM-2 kiểu Anki). Tất cả offline, dữ liệu học lưu cục bộ.

**Bối cảnh roadmap:** File `docs/superpowers/plans/thiet-ke-app-hoc-tieng-nhat.md` là tầm nhìn dài hạn 7 mục (Hôm nay, Lộ trình Riki, Ôn tập, Luyện tập AI, Kho từ, Thống kê, Cài đặt). Spec này hiện thực **mục "🔁 Ôn tập"** ở mức gọn, có chủ đích đơn giản hơn file roadmap (SM-2 thay vì FSRS; chỉ Từ vựng + Kanji, chưa ngữ pháp). Các mục còn lại để pha sau.

## 2. Phạm vi

### Trong phạm vi
- Màn **Ôn tập** (sidebar) với **2 menu con: "Từ vựng" và "Kanji"**, mỗi menu con hiện danh sách bộ thẻ (deck) của loại đó + phiên học. ("Ngữ pháp" để pha sau.)
- **Deck dựng sẵn (6):**
  - *Từ vựng:* "N5 Từ vựng", "N4 Từ vựng", "Từ vựng đã lưu" (bookmark loại word)
  - *Kanji:* "N5 Kanji", "N4 Kanji", "Kanji đã lưu" (bookmark loại kanji)
- Mỗi **mục học** sinh **2 thẻ**: `recognition` (Nhật → nghĩa) và `production` (nghĩa → Nhật).
- **Scheduler SM-2** là module thuần tách riêng (không đụng DB/Vue).
- **Tạo thẻ lười (lazy):** mỗi ngày đưa tối đa N thẻ mới (mặc định 10, chỉnh trong Settings) từ vùng chứa của deck.
- Chấm **Again / Hard / Good / Easy** + phím tắt `Space` (hiện đáp án) và `1-4` (chấm).
- Settings: **số thẻ mới mỗi ngày**.
- Ghi log mỗi lượt ôn vào bảng `reviews` (phục vụ Thống kê sau + có thể undo).

### Ngoài phạm vi (pha sau)
- Thuật toán FSRS (`ts-fsrs`) — có thể nâng cấp vì scheduler đã tách riêng.
- Thẻ **ngữ pháp** / cloze.
- Giới hạn "số lượt ôn mỗi ngày" (chỉ giữ giới hạn thẻ mới).
- Dashboard "Hôm nay", Lộ trình Riki, Luyện tập AI, màn Thống kê, Nhật ký lỗi sai.
- Nghĩa tiếng Việt diện rộng (hiện `gloss_vi` NULL → thẻ hiển thị nghĩa tiếng Anh).
- Export `.apkg` sang Anki thật.

## 3. Quyết định đã chốt (từ brainstorm)

| Vấn đề | Quyết định |
|---|---|
| SRS trong app hay export Anki | **Trong app** (self-contained) |
| Nguồn thẻ | **Deck JLPT dựng sẵn + deck Đã lưu** |
| Chiều thẻ | **Cả hai** (mỗi mục 2 thẻ: recognition + production) |
| Thuật toán | **SM-2**, tách riêng module (nâng FSRS sau) |
| Tên màn & menu | **"Ôn tập"** với 2 menu con **"Từ vựng"** + **"Kanji"** (Ngữ pháp để sau) |
| Loại thẻ | **Từ vựng + Kanji** (ngữ pháp để sau) |
| Mặt nghĩa | Tiếng Việt nếu có, **chưa có thì tiếng Anh** |
| Giới hạn | Chỉ **thẻ mới/ngày** (chỉnh được), không giới hạn lượt ôn |
| "Hôm nay" | Theo **ngày local** của máy |

## 4. Mô hình dữ liệu

Thẻ/lượt ôn là **dữ liệu người dùng** → nằm trong `user.sqlite` (ghi được; spec Pha 0-1 §6 đã dự trù "Pha 2 thêm decks, cards, reviews"). Thẻ **không nhân bản nội dung** — chỉ tham chiếu `(item_type, item_id)` tới `seed.sqlite`, JOIN lấy nội dung lúc hiển thị.

Thêm vào `src/db/user-schema.sql`:

```sql
-- Bộ thẻ. Preset tạo tự động lần đầu nếu bảng rỗng.
CREATE TABLE IF NOT EXISTS decks (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,          -- 'vocab' | 'kanji' (gom theo menu con)
  kind        TEXT NOT NULL,          -- 'jlpt_vocab'|'jlpt_kanji'|'bookmarks_vocab'|'bookmarks_kanji'
  level       TEXT,                   -- 'N5' | 'N4' | NULL (deck Đã lưu)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Thẻ: tham chiếu 1 mục seed + 1 chiều + trạng thái SM-2.
CREATE TABLE IF NOT EXISTS cards (
  id            INTEGER PRIMARY KEY,
  deck_id       INTEGER NOT NULL REFERENCES decks(id),
  item_type     TEXT NOT NULL,        -- 'word' | 'kanji'
  item_id       INTEGER NOT NULL,     -- seed.words.id | seed.kanji.id
  direction     TEXT NOT NULL,        -- 'recognition' | 'production'
  ease_factor   REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  due           TEXT NOT NULL,        -- ISO timestamp; <= now là đến hạn
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (deck_id, item_type, item_id, direction)
);
CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(deck_id, due);

-- Log mỗi lượt ôn.
CREATE TABLE IF NOT EXISTS reviews (
  id             INTEGER PRIMARY KEY,
  card_id        INTEGER NOT NULL REFERENCES cards(id),
  rating         TEXT NOT NULL,       -- 'again'|'hard'|'good'|'easy'
  reviewed_at    TEXT NOT NULL DEFAULT (datetime('now')),
  interval_after REAL NOT NULL        -- interval_days sau khi chấm (ngày)
);
```

**Vùng chứa deck** (xác định "thẻ mới" lấy từ đâu), suy ra từ `kind` + `level`:
- `jlpt_vocab` + level → `SELECT id FROM seed.words WHERE jlpt_level = :level`
- `jlpt_kanji` + level → `SELECT id FROM seed.kanji WHERE jlpt_level = :level`
- `bookmarks_vocab` → `SELECT item_id FROM bookmarks WHERE item_type = 'word'`
- `bookmarks_kanji` → `SELECT item_id FROM bookmarks WHERE item_type = 'kanji'`

**"Thẻ mới"** = mục trong vùng chứa **chưa có card** trong deck đó. Khi giới thiệu: tạo 2 card (recognition + production), `due = now`, trạng thái SM-2 mặc định.

## 5. Module Scheduler SM-2 (thuần, tách riêng)

`src/features/srs/scheduler.ts` — hàm thuần, **không import DB/Vue**, test độc lập.

```ts
export type Rating = "again" | "hard" | "good" | "easy";

export interface CardState {
  easeFactor: number;    // mặc định 2.5
  intervalDays: number;  // 0 = đang học
  repetitions: number;
  lapses: number;
}

export interface ScheduleResult {
  state: CardState;
  due: Date;
}

export function schedule(state: CardState, rating: Rating, now: Date): ScheduleResult;
```

**Luật** (ánh xạ nút → chất lượng q của SM-2: again→1, hard→3, good→4, easy→5):

- **again:** `repetitions = 0`, `lapses += 1`, `due = now + 10 phút`, `easeFactor` giảm theo công thức (kẹp ≥ 1.3), `intervalDays = 0`.
- **hard/good/easy (đúng):**
  - `repetitions === 0` → `intervalDays = 1`
  - `repetitions === 1` → `intervalDays = 6`
  - còn lại → `intervalDays = round(intervalDays × easeFactor)`; **hard** dùng hệ số thấp hơn (~1.2) thay cho easeFactor; **easy** có thưởng (×1.3)
  - `easeFactor += 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02)`, kẹp **≥ 1.3**
  - `repetitions += 1`, `due = now + intervalDays ngày`

Giá trị hiển thị "Good → 6 ngày" trên nút = chạy thử `schedule()` cho từng rating trước khi render.

## 6. Repository

`src/db/srs.repo.ts` — hàm thuần trên `Queryable` (tách khỏi scheduler; repo lo SQL, scheduler lo thuật toán):

- `listDecks(db, category)` → `Deck[]` (lọc theo `category` = 'vocab'|'kanji')
- `getDeckCounts(db, deckId)` → `{ due: number; newRemaining: number }` (new = vùng chứa trừ card đã có, kẹp theo giới hạn ngày − số card tạo hôm nay theo `cards.created_at`)
- `getDueCards(db, deckId, limit)` → card đến hạn (`due <= now`) kèm nội dung JOIN seed
- `introduceNewCards(db, deckId, n)` → tạo tối đa `n` mục mới (×2 chiều), trả card vừa tạo kèm nội dung
- `getCardContent(db, card)` → nội dung hiển thị (headword/kanji, reading/furigana, nghĩa VI||EN, ví dụ, on/kun…)
- `recordReview(db, card, rating)` → gọi `schedule()`, `UPDATE cards`, `INSERT reviews`
- `ensurePresetDecks(db)` → tạo 6 deck preset nếu `decks` rỗng (gọi lúc khởi tạo DB)

## 7. UI & luồng

**Điều hướng:** thêm nhóm **"Ôn tập"** vào sidebar (giữa "Ngữ pháp" và "Đã lưu") với **2 menu con lồng: "Từ vựng" và "Kanji"**. Routes:
- `/review/vocab` → danh sách deck Từ vựng
- `/review/kanji` → danh sách deck Kanji
- `/review/session/:deckId` → phiên học

**`SrsDecksPage.vue`** (route `/review/:category`, dùng chung cho vocab/kanji):
- Liệt kê deck của `category` + 2 số: **Đến hạn** · **Mới** (còn trong giới hạn ngày).
- Bấm deck còn thẻ → `/review/session/:deckId`. Deck hết thẻ hôm nay → nút mờ + "Hôm nay xong".

**`StudySession.vue`** (route `/review/session/:deckId`) — vòng lặp:
1. Hàng đợi = due cards + thẻ mới (giới hạn ngày), trộn hợp lý (due trước).
2. Hiện **mặt trước** (recognition: từ/kanji Nhật + 🔊; production: nghĩa).
3. `Space` hoặc nút **"Hiện đáp án"** → **mặt sau**: cách đọc (furigana), nghĩa (VI||EN), 🔊, 1 câu ví dụ (nếu có).
4. 4 nút **Again/Hard/Good/Easy** (hiện sẵn khoảng cách ôn kế), hoặc phím `1-4`.
5. Chấm → `recordReview` → thẻ kế. Hết hàng đợi → "Xong! Hôm nay không còn thẻ 🎉".

**`useStudyQueue.ts`** (composable): nạp hàng đợi từ repo, giữ vị trí hiện tại, hàm `reveal()`, `grade(rating)`, `next()`, và trạng thái "đã xong".

**Nội dung mặt thẻ:**
- Từ vựng: trước = headword / nghĩa; sau = furigana + reading + nghĩa (VI nếu có, không thì EN) + ví dụ + 🔊.
- Kanji: trước = chữ kanji / nghĩa; sau = on/kun + nghĩa + số nét.

## 8. Settings

Thêm vào màn Cài đặt (lưu qua `user.repo` settings):
- **Số thẻ mới mỗi ngày** (`srs_new_per_day`, mặc định 10, số nguyên ≥ 0).

## 9. Kiến trúc file

```
src/features/srs/
  scheduler.ts            # SM-2 thuần
  SrsDecksPage.vue        # dùng chung vocab/kanji (theo route :category)
  StudySession.vue
  useStudyQueue.ts
src/db/srs.repo.ts        # listDecks(category)/getDeckCounts/getDueCards/introduceNewCards/recordReview/ensurePresetDecks
src/db/user-schema.sql    # + DDL decks/cards/reviews
src/shared/types.ts       # + Deck, Card, CardContent, Rating
src/app/router.ts         # + /review/vocab, /review/kanji, /review/session/:deckId
src/app/Layout.vue        # + nhóm "Ôn tập" (menu con "Từ vựng", "Kanji") sidebar
src/features/settings/SettingsPage.vue  # + ô "thẻ mới/ngày"
electron/main.cjs         # gọi ensurePresetDecks sau initDb (hoặc trong repo lúc load)
```

## 10. Kiểm thử (TDD)

- **`scheduler.ts`** (unit thuần, không DB):
  - again → `repetitions=0`, `lapses+1`, due ~10 phút, ease giảm & kẹp ≥1.3
  - chuỗi đúng: interval 1 → 6 → round(×EF)
  - ease không xuống dưới 1.3
  - easy > good > hard về interval kế
- **`srs.repo.ts`** (DB tạm qua `makeTestDb`):
  - `ensurePresetDecks` tạo đúng 6 deck (3 vocab + 3 kanji), không tạo trùng lần 2
  - `introduceNewCards` tạo đúng 2 card/mục, tôn trọng giới hạn, không lặp mục đã có card
  - `getDueCards` chỉ trả card `due <= now`
  - `recordReview` cập nhật trạng thái card + ghi 1 dòng `reviews`
- **`StudySession.vue`** (smoke, @vue/test-utils): mount với repo mock → "Hiện đáp án" lộ mặt sau → chấm Good gọi recordReview + sang thẻ kế.

## 11. Rủi ro & cách giảm

- **Nghĩa chỉ có tiếng Anh:** chấp nhận tạm (VI khi có); không chặn tính năng.
- **Vùng chứa lớn (hàng trăm từ):** tạo thẻ lười theo giới hạn ngày → DB không phình, truy vấn nhẹ.
- **Lệch ngày/timezone:** mốc "hôm nay" theo local; dùng ISO timestamp cho `due`, so sánh với `now` local.
- **Preset deck chạy nhiều lần:** `ensurePresetDecks` chỉ tạo khi bảng rỗng (idempotent).
- **better-sqlite3 (main) vs node:sqlite (test):** repo viết trên interface `Queryable` nên test bằng node:sqlite, chạy thật qua IPC — không lệ thuộc engine.

## 12. Cột mốc

1. **S0** — DDL decks/cards/reviews + `ensurePresetDecks` + types.
2. **S1** — `scheduler.ts` SM-2 (TDD).
3. **S2** — `srs.repo.ts` (TDD): decks, counts, introduce, due, recordReview.
4. **S3** — `SrsDecksPage.vue` + route + sidebar.
5. **S4** — `StudySession.vue` + `useStudyQueue.ts` + phím tắt.
6. **S5** — Settings "thẻ mới/ngày".
7. **S6** — Chạy app (WSL) xác minh end-to-end + full test xanh.
