# SRS Flashcard (SM-2, in-app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm màn "Ôn tập" (SRS kiểu Anki) cho Từ vựng + Kanji N5/N4 + mục Đã lưu, dùng thuật toán SM-2 trong module thuần tách riêng.

**Architecture:** Scheduler SM-2 là hàm thuần (`src/features/srs/scheduler.ts`), không đụng DB/Vue. Repo (`src/db/srs.repo.ts`) ghép SQL trên `Queryable` và gọi scheduler. UI Vue (SrsDecksPage/StudySession) qua composable `useStudyQueue`. Thẻ lưu ở `user.sqlite` (bảng decks/cards/reviews), chỉ tham chiếu `(item_type,item_id)` tới `seed.sqlite`, JOIN lấy nội dung lúc hiển thị. Thẻ tạo lười theo giới hạn "thẻ mới/ngày".

**Tech Stack:** Electron + Vue 3 + TypeScript + Vite + Tailwind v4, vue-router (hash), Pinia, @tanstack/vue-query, better-sqlite3 (main/IPC) + node:sqlite (test), Vitest + @vue/test-utils.

**Spec:** `docs/superpowers/specs/2026-11-17-srs-flashcard-sm2-design.md`

**Lưu ý chạy test:** toàn bộ test chạy với `--experimental-sqlite`. Chạy 1 file:
`npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run <path>` · Chạy tất cả: `npm test`.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/features/srs/scheduler.ts` (create) | SM-2 thuần: `schedule(state, rating, now)` |
| `src/features/srs/__tests__/scheduler.test.ts` (create) | Unit test scheduler |
| `src/db/srs.repo.ts` (create) | DB: decks/counts/introduce/due/content/recordReview/ensurePresetDecks |
| `src/db/__tests__/srs.repo.test.ts` (create) | Test repo trên DB tạm |
| `src/features/srs/SrsDecksPage.vue` (create) | Danh sách deck theo category + số due/mới |
| `src/features/srs/StudySession.vue` (create) | Phiên học 1 thẻ |
| `src/features/srs/useStudyQueue.ts` (create) | Composable hàng đợi học |
| `src/features/srs/__tests__/StudySession.test.ts` (create) | Smoke test phiên học |
| `src/db/user-schema.sql` (modify) | + DDL decks/cards/reviews |
| `src/shared/types.ts` (modify) | + Deck, Card, CardContent, Rating... |
| `src/shared/settingsStore.ts` (modify) | + srsNewPerDay |
| `src/features/settings/SettingsPage.vue` (modify) | + ô "thẻ mới/ngày" |
| `src/app/router.ts` (modify) | + /review/:category, /review/session/:deckId |
| `src/app/Layout.vue` (modify) | + nhóm "Ôn tập" (Từ vựng/Kanji) |
| `src/main.ts` (modify) | gọi ensurePresetDecks lúc khởi động |

---

## Task 1: Scheduler SM-2 (thuần)

**Files:**
- Create: `src/features/srs/scheduler.ts`
- Test: `src/features/srs/__tests__/scheduler.test.ts`

- [ ] **Step 1: Viết test thất bại**

```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { schedule, type CardState } from "../scheduler";

const fresh: CardState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
const NOW = new Date("2026-11-17T00:00:00.000Z");

describe("schedule (SM-2)", () => {
  it("again: reset repetitions, lapses+1, hẹn ~10 phút, ease giảm", () => {
    const r = schedule({ ...fresh, repetitions: 3, easeFactor: 2.5 }, "again", NOW);
    expect(r.state.repetitions).toBe(0);
    expect(r.state.lapses).toBe(1);
    expect(r.state.intervalDays).toBe(0);
    expect(r.state.easeFactor).toBeCloseTo(2.3, 5);
    expect(r.due.getTime()).toBe(NOW.getTime() + 10 * 60 * 1000);
  });

  it("good lần đầu (reps 0) → interval 1 ngày, reps 1, ease giữ 2.5", () => {
    const r = schedule(fresh, "good", NOW);
    expect(r.state.intervalDays).toBe(1);
    expect(r.state.repetitions).toBe(1);
    expect(r.state.easeFactor).toBeCloseTo(2.5, 5);
    expect(r.due.getTime()).toBe(NOW.getTime() + 1 * 86400000);
  });

  it("good lần 2 (reps 1) → interval 6 ngày", () => {
    const r = schedule({ ...fresh, repetitions: 1, intervalDays: 1 }, "good", NOW);
    expect(r.state.intervalDays).toBe(6);
    expect(r.state.repetitions).toBe(2);
  });

  it("good lần 3 (reps 2, interval 6, EF 2.5) → round(6*2.5)=15", () => {
    const r = schedule({ easeFactor: 2.5, intervalDays: 6, repetitions: 2, lapses: 0 }, "good", NOW);
    expect(r.state.intervalDays).toBe(15);
  });

  it("easy > good > hard về interval kế (reps 2, interval 10)", () => {
    const base: CardState = { easeFactor: 2.5, intervalDays: 10, repetitions: 2, lapses: 0 };
    const hard = schedule(base, "hard", NOW).state.intervalDays;
    const good = schedule(base, "good", NOW).state.intervalDays;
    const easy = schedule(base, "easy", NOW).state.intervalDays;
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("ease không xuống dưới 1.3 dù again nhiều lần", () => {
    let s: CardState = { easeFactor: 1.4, intervalDays: 0, repetitions: 0, lapses: 0 };
    for (let i = 0; i < 5; i++) s = schedule(s, "again", NOW).state;
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
```

- [ ] **Step 2: Chạy test → FAIL**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/features/srs/__tests__/scheduler.test.ts`
Expected: FAIL — `Cannot find module '../scheduler'`.

- [ ] **Step 3: Viết scheduler**

```ts
// src/features/srs/scheduler.ts
export type Rating = "again" | "hard" | "good" | "easy";

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface ScheduleResult {
  state: CardState;
  due: Date;
}

const MIN_EF = 1.3;
const AGAIN_MS = 10 * 60 * 1000; // 10 phút
const DAY_MS = 24 * 60 * 60 * 1000;
const Q: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

/** SM-2 thuần. Không đụng DB/Vue — toàn bộ "bộ não" xếp lịch nằm ở đây. */
export function schedule(state: CardState, rating: Rating, now: Date): ScheduleResult {
  if (rating === "again") {
    return {
      state: {
        easeFactor: Math.max(MIN_EF, state.easeFactor - 0.2),
        intervalDays: 0,
        repetitions: 0,
        lapses: state.lapses + 1,
      },
      due: new Date(now.getTime() + AGAIN_MS),
    };
  }

  // đúng (hard/good/easy)
  let intervalDays: number;
  if (state.repetitions === 0) intervalDays = 1;
  else if (state.repetitions === 1) intervalDays = 6;
  else {
    const factor =
      rating === "hard" ? 1.2 : rating === "easy" ? state.easeFactor * 1.3 : state.easeFactor;
    intervalDays = Math.round(state.intervalDays * factor);
  }

  const q = Q[rating];
  const easeFactor = Math.max(
    MIN_EF,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    state: { easeFactor, intervalDays, repetitions: state.repetitions + 1, lapses: state.lapses },
    due: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}
```

- [ ] **Step 4: Chạy test → PASS**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/features/srs/__tests__/scheduler.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/srs/scheduler.ts src/features/srs/__tests__/scheduler.test.ts
git commit -m "feat(srs): SM-2 scheduler thuần + test"
```

---

## Task 2: DDL (decks/cards/reviews) + types

**Files:**
- Modify: `src/db/user-schema.sql` (append)
- Modify: `src/shared/types.ts` (append)

- [ ] **Step 1: Thêm DDL vào cuối `src/db/user-schema.sql`**

```sql
-- SRS: bộ thẻ, thẻ, lượt ôn (Pha 2). Thẻ tham chiếu seed (item_type,item_id).
CREATE TABLE IF NOT EXISTS decks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,          -- 'vocab' | 'kanji'
  kind        TEXT NOT NULL,          -- 'jlpt_vocab'|'jlpt_kanji'|'bookmarks_vocab'|'bookmarks_kanji'
  level       TEXT,                   -- 'N5' | 'N4' | NULL
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id       INTEGER NOT NULL REFERENCES decks(id),
  item_type     TEXT NOT NULL,        -- 'word' | 'kanji'
  item_id       INTEGER NOT NULL,
  direction     TEXT NOT NULL,        -- 'recognition' | 'production'
  ease_factor   REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  due           TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (deck_id, item_type, item_id, direction)
);
CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(deck_id, due);
CREATE TABLE IF NOT EXISTS reviews (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id        INTEGER NOT NULL REFERENCES cards(id),
  rating         TEXT NOT NULL,
  reviewed_at    TEXT NOT NULL DEFAULT (datetime('now')),
  interval_after REAL NOT NULL
);
```

- [ ] **Step 2: Thêm types vào cuối `src/shared/types.ts`**

```ts
export type DeckCategory = "vocab" | "kanji";
export type DeckKind =
  | "jlpt_vocab"
  | "jlpt_kanji"
  | "bookmarks_vocab"
  | "bookmarks_kanji";
export type CardDirection = "recognition" | "production";
export type Rating = "again" | "hard" | "good" | "easy";

export interface Deck {
  id: number;
  name: string;
  category: DeckCategory;
  kind: DeckKind;
  level: string | null;
}

export interface DeckCounts {
  due: number;
  newRemaining: number;
}

export interface Card {
  id: number;
  deck_id: number;
  item_type: "word" | "kanji";
  item_id: number;
  direction: CardDirection;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due: string;
}

export interface CardContent {
  cardId: number;
  itemType: "word" | "kanji";
  direction: CardDirection;
  japanese: string; // headword hoặc literal kanji
  reading: string | null;
  meaning: string | null;
  exampleJp: string | null;
  exampleFurigana: string | null;
  exampleEn: string | null;
  strokeCount: number | null;
}
```

- [ ] **Step 3: Kiểm typecheck không vỡ**

Run: `npx vue-tsc --noEmit`
Expected: không lỗi (types mới chưa dùng ở đâu nên không ảnh hưởng).

- [ ] **Step 4: Commit**

```bash
git add src/db/user-schema.sql src/shared/types.ts
git commit -m "feat(srs): DDL decks/cards/reviews + types"
```

---

## Task 3: srs.repo — ensurePresetDecks + listDecks

**Files:**
- Create: `src/db/srs.repo.ts`
- Test: `src/db/__tests__/srs.repo.test.ts`

- [ ] **Step 1: Viết test thất bại**

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb, type TestDb } from "./makeTestDb";
import { ensurePresetDecks, listDecks } from "../srs.repo";

describe("srs.repo decks", () => {
  let t: TestDb;
  beforeEach(() => {
    t = makeTestDb();
  });

  it("ensurePresetDecks tạo đúng 6 deck (3 vocab + 3 kanji), idempotent", async () => {
    await ensurePresetDecks(t.q);
    await ensurePresetDecks(t.q); // lần 2 không tạo thêm
    const all = t.raw.prepare("SELECT category, COUNT(*) c FROM decks GROUP BY category").all();
    expect(all).toEqual([
      { category: "kanji", c: 3 },
      { category: "vocab", c: 3 },
    ]);
  });

  it("listDecks lọc theo category", async () => {
    await ensurePresetDecks(t.q);
    const vocab = await listDecks(t.q, "vocab");
    const kanji = await listDecks(t.q, "kanji");
    expect(vocab).toHaveLength(3);
    expect(kanji).toHaveLength(3);
    expect(vocab.every((d) => d.category === "vocab")).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test → FAIL**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: FAIL — `Cannot find module '../srs.repo'`.

- [ ] **Step 3: Tạo `src/db/srs.repo.ts` với phần decks**

```ts
import type { Queryable } from "./queryable";
import type { Deck, DeckCategory } from "../shared/types";

const PRESET_DECKS: Omit<Deck, "id">[] = [
  { name: "N5 Từ vựng", category: "vocab", kind: "jlpt_vocab", level: "N5" },
  { name: "N4 Từ vựng", category: "vocab", kind: "jlpt_vocab", level: "N4" },
  { name: "Từ vựng đã lưu", category: "vocab", kind: "bookmarks_vocab", level: null },
  { name: "N5 Kanji", category: "kanji", kind: "jlpt_kanji", level: "N5" },
  { name: "N4 Kanji", category: "kanji", kind: "jlpt_kanji", level: "N4" },
  { name: "Kanji đã lưu", category: "kanji", kind: "bookmarks_kanji", level: null },
];

/** Tạo 6 deck preset nếu bảng decks còn rỗng (idempotent). */
export async function ensurePresetDecks(db: Queryable): Promise<void> {
  const rows = await db.select<{ n: number }>("SELECT COUNT(*) AS n FROM decks");
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const d of PRESET_DECKS) {
    await db.execute(
      "INSERT INTO decks (name, category, kind, level) VALUES (?,?,?,?)",
      [d.name, d.category, d.kind, d.level],
    );
  }
}

export async function listDecks(
  db: Queryable,
  category: DeckCategory,
): Promise<Deck[]> {
  return db.select<Deck>(
    "SELECT id, name, category, kind, level FROM decks WHERE category = ? ORDER BY id",
    [category],
  );
}
```

- [ ] **Step 4: Chạy test → PASS**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/db/srs.repo.ts src/db/__tests__/srs.repo.test.ts
git commit -m "feat(srs): repo ensurePresetDecks + listDecks"
```

---

## Task 4: srs.repo — introduceNewCards + getDeckCounts

**Files:**
- Modify: `src/db/srs.repo.ts` (append)
- Modify: `src/db/__tests__/srs.repo.test.ts` (append)

- [ ] **Step 1: Thêm test thất bại (append vào file test)**

```ts
import { introduceNewCards, getDeckCounts } from "../srs.repo";

function seedVocab(t: TestDb) {
  t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
    (1,'食べる','たべる','taberu','N5',1),
    (2,'飲む','のむ','nomu','N5',1),
    (3,'持つ','もつ','motsu','N4',0)`);
}

describe("srs.repo introduce + counts", () => {
  let t: TestDb;
  let n5VocabId: number;
  beforeEach(async () => {
    t = makeTestDb();
    seedVocab(t);
    await ensurePresetDecks(t.q);
    const d = await listDecks(t.q, "vocab");
    n5VocabId = d.find((x) => x.level === "N5")!.id;
  });

  it("introduceNewCards tạo 2 thẻ/mục (recognition+production), tôn trọng limit", async () => {
    const created = await introduceNewCards(t.q, n5VocabId, 1); // 1 mục mới
    expect(created).toHaveLength(2);
    expect(new Set(created.map((c) => c.direction))).toEqual(
      new Set(["recognition", "production"]),
    );
    const total = t.raw.prepare("SELECT COUNT(*) c FROM cards").get() as { c: number };
    expect(total.c).toBe(2);
  });

  it("introduceNewCards không lặp mục đã có thẻ", async () => {
    await introduceNewCards(t.q, n5VocabId, 1);
    await introduceNewCards(t.q, n5VocabId, 1); // mục kế, không trùng
    const items = t.raw
      .prepare("SELECT DISTINCT item_id FROM cards ORDER BY item_id")
      .all() as { item_id: number }[];
    expect(items.map((x) => x.item_id)).toEqual([1, 2]);
  });

  it("getDeckCounts: due = thẻ đến hạn; newRemaining theo pool & limit ngày", async () => {
    // N5 vocab pool = {1,2}. Chưa có thẻ nào.
    const before = await getDeckCounts(t.q, n5VocabId, 10);
    expect(before.due).toBe(0);
    expect(before.newRemaining).toBe(2); // min(pool=2, limit=10)

    await introduceNewCards(t.q, n5VocabId, 2); // giới thiệu cả 2 mục hôm nay
    const after = await getDeckCounts(t.q, n5VocabId, 10);
    expect(after.due).toBe(4); // 2 mục × 2 thẻ, due = now
    expect(after.newRemaining).toBe(0); // pool cạn
  });
});
```

- [ ] **Step 2: Chạy test → FAIL**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: FAIL — `introduceNewCards` chưa export.

- [ ] **Step 3: Thêm vào `src/db/srs.repo.ts`**

```ts
import type { Card, CardDirection } from "../shared/types";

const DIRECTIONS: CardDirection[] = ["recognition", "production"];

async function getDeck(db: Queryable, deckId: number): Promise<Deck | undefined> {
  const r = await db.select<Deck>(
    "SELECT id, name, category, kind, level FROM decks WHERE id = ?",
    [deckId],
  );
  return r[0];
}

function itemTypeOf(deck: Deck): "word" | "kanji" {
  return deck.category === "vocab" ? "word" : "kanji";
}

/** item_id của vùng chứa deck (từ seed hoặc bookmarks). */
async function poolItemIds(db: Queryable, deck: Deck): Promise<number[]> {
  let rows: { id: number }[];
  switch (deck.kind) {
    case "jlpt_vocab":
      rows = await db.select<{ id: number }>(
        "SELECT id FROM words WHERE jlpt_level = ? ORDER BY is_common DESC, freq_rank IS NULL, freq_rank ASC, id",
        [deck.level],
      );
      break;
    case "jlpt_kanji":
      rows = await db.select<{ id: number }>(
        "SELECT id FROM kanji WHERE jlpt_level = ? ORDER BY stroke_count, id",
        [deck.level],
      );
      break;
    case "bookmarks_vocab":
      rows = await db.select<{ id: number }>(
        "SELECT item_id AS id FROM bookmarks WHERE item_type = 'word' ORDER BY id",
      );
      break;
    case "bookmarks_kanji":
      rows = await db.select<{ id: number }>(
        "SELECT item_id AS id FROM bookmarks WHERE item_type = 'kanji' ORDER BY id",
      );
      break;
    default:
      rows = [];
  }
  return rows.map((r) => r.id);
}

async function cardedItemIds(db: Queryable, deckId: number): Promise<Set<number>> {
  const rows = await db.select<{ item_id: number }>(
    "SELECT DISTINCT item_id FROM cards WHERE deck_id = ?",
    [deckId],
  );
  return new Set(rows.map((r) => r.item_id));
}

/** Giới thiệu tối đa `n` mục mới (chưa có thẻ) → tạo 2 thẻ/mục. Trả thẻ vừa tạo. */
export async function introduceNewCards(
  db: Queryable,
  deckId: number,
  n: number,
): Promise<Card[]> {
  if (n <= 0) return [];
  const deck = await getDeck(db, deckId);
  if (!deck) return [];
  const itemType = itemTypeOf(deck);
  const pool = await poolItemIds(db, deck);
  const carded = await cardedItemIds(db, deckId);
  const fresh = pool.filter((id) => !carded.has(id)).slice(0, n);
  const nowIso = new Date().toISOString();
  const created: Card[] = [];
  for (const itemId of fresh) {
    for (const direction of DIRECTIONS) {
      const res = await db.execute(
        `INSERT OR IGNORE INTO cards (deck_id, item_type, item_id, direction, due)
         VALUES (?,?,?,?,?)`,
        [deckId, itemType, itemId, direction, nowIso],
      );
      if (res.changes > 0) {
        created.push({
          id: res.lastInsertRowid,
          deck_id: deckId,
          item_type: itemType,
          item_id: itemId,
          direction,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          lapses: 0,
          due: nowIso,
        });
      }
    }
  }
  return created;
}

/** Số thẻ đến hạn + số mục mới còn được giới thiệu hôm nay (theo newPerDay). */
export async function getDeckCounts(
  db: Queryable,
  deckId: number,
  newPerDay: number,
): Promise<{ due: number; newRemaining: number }> {
  const nowIso = new Date().toISOString();
  const dueRow = await db.select<{ n: number }>(
    "SELECT COUNT(*) AS n FROM cards WHERE deck_id = ? AND due <= ?",
    [deckId, nowIso],
  );
  const deck = await getDeck(db, deckId);
  if (!deck) return { due: dueRow[0]?.n ?? 0, newRemaining: 0 };

  const pool = await poolItemIds(db, deck);
  const carded = await cardedItemIds(db, deckId);
  const poolRemaining = pool.filter((id) => !carded.has(id)).length;

  const introRow = await db.select<{ n: number }>(
    `SELECT COUNT(DISTINCT item_id) AS n FROM cards
     WHERE deck_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')`,
    [deckId],
  );
  const introducedToday = introRow[0]?.n ?? 0;
  const newRemaining = Math.max(
    0,
    Math.min(poolRemaining, newPerDay - introducedToday),
  );
  return { due: dueRow[0]?.n ?? 0, newRemaining };
}
```

- [ ] **Step 4: Chạy test → PASS**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/db/srs.repo.ts src/db/__tests__/srs.repo.test.ts
git commit -m "feat(srs): introduceNewCards + getDeckCounts"
```

---

## Task 5: srs.repo — getDueCards + getCardContent + recordReview

**Files:**
- Modify: `src/db/srs.repo.ts` (append)
- Modify: `src/db/__tests__/srs.repo.test.ts` (append)

- [ ] **Step 1: Thêm test thất bại (append)**

```ts
import { getDueCards, getCardContent, recordReview } from "../srs.repo";

describe("srs.repo due/content/review", () => {
  let t: TestDb;
  let deckId: number;
  beforeEach(async () => {
    t = makeTestDb();
    t.raw.exec(`INSERT INTO words (id, headword, reading_kana, reading_romaji, jlpt_level, is_common) VALUES
      (1,'食べる','たべる','taberu','N5',1)`);
    t.raw.exec(`INSERT INTO senses (word_id, part_of_speech, gloss_en, gloss_vi, order_idx) VALUES
      (1,'v1','to eat','ăn',0)`);
    t.raw.exec(`INSERT INTO sentences (id, jp_text, furigana, translation_en, source) VALUES
      (1,'ご飯を食べる。','ご{飯|はん}を{食|た}べる。','I eat rice.','tatoeba:1')`);
    t.raw.exec(`INSERT INTO sentence_words (sentence_id, word_id) VALUES (1,1)`);
    await ensurePresetDecks(t.q);
    deckId = (await listDecks(t.q, "vocab")).find((d) => d.level === "N5")!.id;
    await introduceNewCards(t.q, deckId, 1);
  });

  it("getDueCards trả thẻ đến hạn của deck", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    expect(due.length).toBe(2); // 1 mục × 2 chiều, due = now
    expect(due[0].deck_id).toBe(deckId);
  });

  it("getCardContent (word) trả japanese/reading/meaning + ví dụ (ưu tiên gloss_vi)", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    const content = await getCardContent(t.q, due[0]);
    expect(content.japanese).toBe("食べる");
    expect(content.reading).toBe("たべる");
    expect(content.meaning).toBe("ăn");
    expect(content.exampleJp).toBe("ご飯を食べる。");
    expect(content.exampleEn).toBe("I eat rice.");
  });

  it("recordReview good: cập nhật card + ghi 1 dòng reviews", async () => {
    const due = await getDueCards(t.q, deckId, 10);
    await recordReview(t.q, due[0], "good");
    const card = t.raw.prepare("SELECT repetitions, interval_days FROM cards WHERE id = ?").get(due[0].id) as { repetitions: number; interval_days: number };
    expect(card.repetitions).toBe(1);
    expect(card.interval_days).toBe(1);
    const rev = t.raw.prepare("SELECT COUNT(*) c FROM reviews WHERE card_id = ?").get(due[0].id) as { c: number };
    expect(rev.c).toBe(1);
  });
});
```

- [ ] **Step 2: Chạy test → FAIL**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: FAIL — `getDueCards` chưa export.

- [ ] **Step 3: Thêm vào `src/db/srs.repo.ts`**

```ts
import type { CardContent, Rating } from "../shared/types";
import { schedule } from "../features/srs/scheduler";

export async function getDueCards(
  db: Queryable,
  deckId: number,
  limit: number,
): Promise<Card[]> {
  const nowIso = new Date().toISOString();
  return db.select<Card>(
    `SELECT id, deck_id, item_type, item_id, direction,
            ease_factor, interval_days, repetitions, lapses, due
     FROM cards WHERE deck_id = ? AND due <= ? ORDER BY due LIMIT ?`,
    [deckId, nowIso, limit],
  );
}

export async function getCardContent(
  db: Queryable,
  card: Card,
): Promise<CardContent> {
  const base: CardContent = {
    cardId: card.id,
    itemType: card.item_type,
    direction: card.direction,
    japanese: "",
    reading: null,
    meaning: null,
    exampleJp: null,
    exampleFurigana: null,
    exampleEn: null,
    strokeCount: null,
  };

  if (card.item_type === "word") {
    const w = (
      await db.select<{ headword: string; reading_kana: string }>(
        "SELECT headword, reading_kana FROM words WHERE id = ?",
        [card.item_id],
      )
    )[0];
    const s = (
      await db.select<{ m: string | null }>(
        `SELECT COALESCE(gloss_vi, gloss_en) AS m FROM senses
         WHERE word_id = ? ORDER BY order_idx LIMIT 1`,
        [card.item_id],
      )
    )[0];
    const ex = (
      await db.select<{ jp_text: string; furigana: string | null; translation_en: string | null }>(
        `SELECT s.jp_text, s.furigana, s.translation_en
         FROM sentences s JOIN sentence_words sw ON sw.sentence_id = s.id
         WHERE sw.word_id = ? LIMIT 1`,
        [card.item_id],
      )
    )[0];
    return {
      ...base,
      japanese: w?.headword ?? "",
      reading: w?.reading_kana ?? null,
      meaning: s?.m ?? null,
      exampleJp: ex?.jp_text ?? null,
      exampleFurigana: ex?.furigana ?? null,
      exampleEn: ex?.translation_en ?? null,
    };
  }

  // kanji
  const k = (
    await db.select<{
      literal: string;
      on_readings: string | null;
      kun_readings: string | null;
      meaning_vi: string | null;
      meaning_en: string | null;
      stroke_count: number | null;
    }>(
      `SELECT literal, on_readings, kun_readings, meaning_vi, meaning_en, stroke_count
       FROM kanji WHERE id = ?`,
      [card.item_id],
    )
  )[0];
  const reading = [k?.on_readings, k?.kun_readings].filter(Boolean).join(" / ") || null;
  return {
    ...base,
    japanese: k?.literal ?? "",
    reading,
    meaning: k?.meaning_vi ?? k?.meaning_en ?? null,
    strokeCount: k?.stroke_count ?? null,
  };
}

export async function recordReview(
  db: Queryable,
  card: Card,
  rating: Rating,
): Promise<void> {
  const res = schedule(
    {
      easeFactor: card.ease_factor,
      intervalDays: card.interval_days,
      repetitions: card.repetitions,
      lapses: card.lapses,
    },
    rating,
    new Date(),
  );
  await db.execute(
    `UPDATE cards SET ease_factor = ?, interval_days = ?, repetitions = ?, lapses = ?, due = ?
     WHERE id = ?`,
    [
      res.state.easeFactor,
      res.state.intervalDays,
      res.state.repetitions,
      res.state.lapses,
      res.due.toISOString(),
      card.id,
    ],
  );
  await db.execute(
    "INSERT INTO reviews (card_id, rating, interval_after) VALUES (?,?,?)",
    [card.id, rating, res.state.intervalDays],
  );
}
```

- [ ] **Step 4: Chạy test → PASS**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/db/__tests__/srs.repo.test.ts`
Expected: PASS (8 tests tổng).

- [ ] **Step 5: Commit**

```bash
git add src/db/srs.repo.ts src/db/__tests__/srs.repo.test.ts
git commit -m "feat(srs): getDueCards + getCardContent + recordReview"
```

---

## Task 6: Settings — số thẻ mới/ngày

**Files:**
- Modify: `src/shared/settingsStore.ts`
- Modify: `src/features/settings/SettingsPage.vue`

- [ ] **Step 1: Thêm `srsNewPerDay` vào store**

Trong `src/shared/settingsStore.ts`:

Sửa interface `State` — thêm field:
```ts
  ttsVoiceURI: string;
  srsNewPerDay: number;
  loaded: boolean;
```

Sửa `state` mặc định — thêm:
```ts
    ttsVoiceURI: "",
    srsNewPerDay: 10,
    loaded: false,
```

Trong `load()`, sửa khối Promise.all + gán:
```ts
      const [theme, fontScale, ttsRate, ttsVoiceURI, srsNewPerDay] =
        await Promise.all([
          getSetting(db, "theme"),
          getSetting(db, "fontScale"),
          getSetting(db, "ttsRate"),
          getSetting(db, "ttsVoiceURI"),
          getSetting(db, "srsNewPerDay"),
        ]);
      this.theme = (theme as Theme) || "dark";
      this.fontScale = fontScale ? Number(fontScale) : 1;
      this.ttsRate = ttsRate ? Number(ttsRate) : 1;
      this.ttsVoiceURI = ttsVoiceURI || "";
      this.srsNewPerDay = srsNewPerDay ? Number(srsNewPerDay) : 10;
```

Sửa tham số `update()`:
```ts
    update(
      patch: Partial<
        Pick<
          State,
          "theme" | "fontScale" | "ttsRate" | "ttsVoiceURI" | "srsNewPerDay"
        >
      >,
    ) {
```

- [ ] **Step 2: Thêm mục cài đặt vào `SettingsPage.vue`**

Thêm `<section>` mới ngay sau `</section>` cuối cùng (trước `</div>` đóng khung ngoài):
```html
    <section class="mt-6">
      <h3 class="mb-2 font-semibold">Ôn tập (SRS)</h3>
      <div class="flex items-center gap-3">
        <span class="w-28 text-slate-500">Thẻ mới/ngày</span>
        <input
          type="number"
          min="0"
          max="100"
          :value="settings.srsNewPerDay"
          @input="
            settings.update({
              srsNewPerDay: Math.max(
                0,
                Number(($event.target as HTMLInputElement).value) || 0,
              ),
            })
          "
          class="w-24 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
    </section>
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run build`
Expected: vue-tsc + vite build thành công.

- [ ] **Step 4: Commit**

```bash
git add src/shared/settingsStore.ts src/features/settings/SettingsPage.vue
git commit -m "feat(srs): cài đặt số thẻ mới/ngày"
```

---

## Task 7: Router + Layout (nav "Ôn tập")

**Files:**
- Modify: `src/app/router.ts`
- Modify: `src/app/Layout.vue`

- [ ] **Step 1: Thêm route**

Trong `src/app/router.ts`, thêm import:
```ts
import SrsDecksPage from "../features/srs/SrsDecksPage.vue";
import StudySession from "../features/srs/StudySession.vue";
```
Thêm vào mảng `routes` (trước route `/saved`):
```ts
    { path: "/review/session/:deckId", component: StudySession },
    { path: "/review/:category", component: SrsDecksPage },
```

- [ ] **Step 2: Thêm nhóm "Ôn tập" vào `Layout.vue`**

Thay khối `<script setup>` nav bằng:
```ts
const nav = [
  { to: "/", label: "Tra từ", exact: true },
  { to: "/kanji", label: "Kanji", exact: false },
  { to: "/grammar", label: "Ngữ pháp", exact: false },
];
const reviewNav = [
  { to: "/review/vocab", label: "Từ vựng", exact: false },
  { to: "/review/kanji", label: "Kanji", exact: false },
];
const nav2 = [
  { to: "/saved", label: "Đã lưu", exact: false },
  { to: "/settings", label: "Cài đặt", exact: false },
];
```

Thay `<nav>` trong template bằng:
```html
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[base, isActive(item) ? activeCls : idleCls]"
        >
          {{ item.label }}
        </RouterLink>

        <p class="mt-3 px-2 text-xs font-semibold uppercase text-slate-400">
          Ôn tập
        </p>
        <RouterLink
          v-for="item in reviewNav"
          :key="item.to"
          :to="item.to"
          :class="[base, 'ml-2', isActive(item) ? activeCls : idleCls]"
        >
          {{ item.label }}
        </RouterLink>

        <div class="mt-3 flex flex-col gap-1">
          <RouterLink
            v-for="item in nav2"
            :key="item.to"
            :to="item.to"
            :class="[base, isActive(item) ? activeCls : idleCls]"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
```

(`isActive` giữ nguyên — dùng `route.path.startsWith(item.to)`.)

- [ ] **Step 3: Commit (UI chưa có page, sẽ tạo Task 8-9; build sau Task 9)**

```bash
git add src/app/router.ts src/app/Layout.vue
git commit -m "feat(srs): route + nav nhóm Ôn tập"
```

---

## Task 8: SrsDecksPage.vue

**Files:**
- Create: `src/features/srs/SrsDecksPage.vue`

- [ ] **Step 1: Tạo page**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink, useRoute } from "vue-router";
import { getDb } from "../../db/client";
import { listDecks, getDeckCounts } from "../../db/srs.repo";
import { useSettings } from "../../shared/settingsStore";
import type { DeckCategory } from "../../shared/types";

const route = useRoute();
const settings = useSettings();
const category = computed(() => route.params.category as DeckCategory);
const title = computed(() =>
  category.value === "kanji" ? "Ôn tập Kanji" : "Ôn tập Từ vựng",
);

const { data: decks } = useQuery({
  queryKey: ["srs-decks", category],
  queryFn: async () => {
    const db = getDb();
    const list = await listDecks(db, category.value);
    return Promise.all(
      list.map(async (d) => ({
        ...d,
        counts: await getDeckCounts(db, d.id, settings.srsNewPerDay),
      })),
    );
  },
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="mb-4 text-xl font-semibold">{{ title }}</h2>
    <ul class="space-y-2">
      <li
        v-for="d in decks"
        :key="d.id"
        class="flex items-center justify-between rounded border border-slate-200 p-3 dark:border-slate-800"
      >
        <div>
          <p class="font-medium">{{ d.name }}</p>
          <p class="text-sm text-slate-500">
            Đến hạn: <b>{{ d.counts.due }}</b> · Mới:
            <b>{{ d.counts.newRemaining }}</b>
          </p>
        </div>
        <RouterLink
          v-if="d.counts.due + d.counts.newRemaining > 0"
          :to="`/review/session/${d.id}`"
          class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          Học
        </RouterLink>
        <span v-else class="text-sm text-slate-400">Hôm nay xong ✓</span>
      </li>
    </ul>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/srs/SrsDecksPage.vue
git commit -m "feat(srs): trang danh sách bộ thẻ"
```

---

## Task 9: useStudyQueue + StudySession.vue

**Files:**
- Create: `src/features/srs/useStudyQueue.ts`
- Create: `src/features/srs/StudySession.vue`
- Test: `src/features/srs/__tests__/StudySession.test.ts`

- [ ] **Step 1: Tạo composable `useStudyQueue.ts`**

```ts
import { computed, ref } from "vue";
import { getDb } from "../../db/client";
import { useSettings } from "../../shared/settingsStore";
import {
  getDueCards,
  getCardContent,
  introduceNewCards,
  getDeckCounts,
  recordReview,
} from "../../db/srs.repo";
import type { Card, CardContent, Rating } from "../../shared/types";

export interface QueueItem {
  card: Card;
  content: CardContent;
}

export function useStudyQueue(deckId: number) {
  const queue = ref<QueueItem[]>([]);
  const index = ref(0);
  const revealed = ref(false);
  const loading = ref(true);
  const settings = useSettings();

  const current = computed<QueueItem | undefined>(() => queue.value[index.value]);
  const done = computed(() => !loading.value && index.value >= queue.value.length);
  const remaining = computed(() => Math.max(0, queue.value.length - index.value));

  async function build() {
    const db = getDb();
    const counts = await getDeckCounts(db, deckId, settings.srsNewPerDay);
    const due = await getDueCards(db, deckId, 200);
    const fresh = await introduceNewCards(db, deckId, counts.newRemaining);
    const cards = [...due, ...fresh];
    queue.value = await Promise.all(
      cards.map(async (card) => ({ card, content: await getCardContent(db, card) })),
    );
    index.value = 0;
    revealed.value = false;
    loading.value = false;
  }

  function reveal() {
    revealed.value = true;
  }

  async function grade(rating: Rating) {
    const item = current.value;
    if (!item) return;
    await recordReview(getDb(), item.card, rating);
    if (rating === "again") queue.value.push(item); // xem lại cuối phiên
    index.value += 1;
    revealed.value = false;
  }

  void build();

  return { current, done, loading, remaining, revealed, reveal, grade };
}
```

- [ ] **Step 2: Tạo `StudySession.vue`**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useStudyQueue } from "./useStudyQueue";
import SpeakButton from "../../shared/tts/SpeakButton.vue";
import FuriganaText from "../../shared/FuriganaText.vue";

const route = useRoute();
const deckId = Number(route.params.deckId);
const { current, done, loading, remaining, revealed, reveal, grade } =
  useStudyQueue(deckId);

function onKey(e: KeyboardEvent) {
  if (done.value || loading.value) return;
  if (!revealed.value && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    reveal();
    return;
  }
  if (revealed.value) {
    const map: Record<string, "again" | "hard" | "good" | "easy"> = {
      "1": "again",
      "2": "hard",
      "3": "good",
      "4": "easy",
    };
    if (map[e.key]) void grade(map[e.key]);
  }
}
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

const GRADES = [
  { rating: "again", label: "Again (1)", cls: "bg-rose-600 hover:bg-rose-700" },
  { rating: "hard", label: "Hard (2)", cls: "bg-amber-600 hover:bg-amber-700" },
  { rating: "good", label: "Good (3)", cls: "bg-emerald-600 hover:bg-emerald-700" },
  { rating: "easy", label: "Easy (4)", cls: "bg-sky-600 hover:bg-sky-700" },
] as const;
</script>

<template>
  <div class="mx-auto max-w-xl">
    <p v-if="loading" class="text-slate-500">Đang tải…</p>

    <div v-else-if="done" class="text-center">
      <p class="mb-4 text-lg">Xong! Hôm nay không còn thẻ 🎉</p>
      <RouterLink to="/review/vocab" class="text-indigo-600">← Về bộ thẻ</RouterLink>
    </div>

    <div v-else-if="current" class="text-center">
      <p class="mb-4 text-sm text-slate-400">Còn lại: {{ remaining }}</p>

      <!-- Mặt trước -->
      <div class="mb-6 rounded-lg border border-slate-200 p-8 dark:border-slate-800">
        <template v-if="current.content.direction === 'recognition'">
          <div class="flex items-center justify-center gap-3">
            <span class="text-4xl font-bold">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" />
          </div>
        </template>
        <template v-else>
          <span class="text-2xl">{{ current.content.meaning }}</span>
        </template>

        <!-- Mặt sau -->
        <div v-if="revealed" class="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div v-if="current.content.direction === 'production'" class="flex items-center justify-center gap-3">
            <span class="text-4xl font-bold">{{ current.content.japanese }}</span>
            <SpeakButton :text="current.content.japanese" />
          </div>
          <p v-if="current.content.reading" class="mt-2 text-slate-500">
            {{ current.content.reading }}
          </p>
          <p v-if="current.content.direction === 'recognition'" class="mt-1 text-lg">
            {{ current.content.meaning }}
          </p>
          <p v-if="current.content.strokeCount" class="mt-1 text-sm text-slate-400">
            {{ current.content.strokeCount }} nét
          </p>
          <div v-if="current.content.exampleJp" class="mt-4 flex items-start justify-center gap-2 text-left">
            <SpeakButton :text="current.content.exampleJp" />
            <div>
              <p>
                <FuriganaText
                  v-if="current.content.exampleFurigana"
                  :text="current.content.exampleFurigana"
                />
                <template v-else>{{ current.content.exampleJp }}</template>
              </p>
              <p v-if="current.content.exampleEn" class="text-sm text-slate-500">
                {{ current.content.exampleEn }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="!revealed"
        type="button"
        @click="reveal"
        class="rounded bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
      >
        Hiện đáp án (Space)
      </button>
      <div v-else class="flex justify-center gap-2">
        <button
          v-for="g in GRADES"
          :key="g.rating"
          type="button"
          @click="grade(g.rating)"
          :class="['rounded px-4 py-2 text-sm text-white', g.cls]"
        >
          {{ g.label }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Viết smoke test**

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Card, CardContent } from "../../../shared/types";

const card: Card = {
  id: 1, deck_id: 1, item_type: "word", item_id: 1, direction: "recognition",
  ease_factor: 2.5, interval_days: 0, repetitions: 0, lapses: 0, due: "2026-01-01T00:00:00.000Z",
};
const content: CardContent = {
  cardId: 1, itemType: "word", direction: "recognition",
  japanese: "食べる", reading: "たべる", meaning: "ăn",
  exampleJp: null, exampleFurigana: null, exampleEn: null, strokeCount: null,
};
const recordReview = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../db/client", () => ({ getDb: () => ({}) }));
vi.mock("../../../db/srs.repo", () => ({
  getDeckCounts: vi.fn().mockResolvedValue({ due: 1, newRemaining: 0 }),
  getDueCards: vi.fn().mockResolvedValue([card]),
  introduceNewCards: vi.fn().mockResolvedValue([]),
  getCardContent: vi.fn().mockResolvedValue(content),
  recordReview: (...a: unknown[]) => recordReview(...a),
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { deckId: "1" } }),
  RouterLink: { template: "<a><slot/></a>" },
}));

import StudySession from "../StudySession.vue";

const stubs = { SpeakButton: true, FuriganaText: true };

describe("StudySession", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("hiện mặt trước → Hiện đáp án lộ nghĩa → Good gọi recordReview", async () => {
    const wrapper = mount(StudySession, { global: { stubs } });
    await new Promise((r) => setTimeout(r, 0)); // chờ build() hàng đợi
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("食べる");
    expect(wrapper.text()).not.toContain("ăn");

    await wrapper.get("button").trigger("click"); // Hiện đáp án
    expect(wrapper.text()).toContain("ăn");

    const good = wrapper.findAll("button").find((b) => b.text().includes("Good"));
    await good!.trigger("click");
    expect(recordReview).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 4: Chạy smoke test → PASS**

Run: `npx cross-env NODE_OPTIONS=--experimental-sqlite vitest run src/features/srs/__tests__/StudySession.test.ts`
Expected: PASS (1 test). Nếu đỏ vì timing, tăng `setTimeout` lên 10ms.

- [ ] **Step 5: Build toàn bộ**

Run: `npm run build`
Expected: vue-tsc + vite build thành công (mọi .vue + route mới biên dịch).

- [ ] **Step 6: Commit**

```bash
git add src/features/srs/useStudyQueue.ts src/features/srs/StudySession.vue src/features/srs/__tests__/StudySession.test.ts
git commit -m "feat(srs): phiên học (queue + session + phím tắt) + smoke test"
```

---

## Task 10: Bootstrap preset decks + xác minh end-to-end

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Gọi `ensurePresetDecks` lúc khởi động**

Sửa cuối `src/main.ts`:
```ts
import { useSettings } from "./shared/settingsStore";
import { getDb } from "./db/client";
import { ensurePresetDecks } from "./db/srs.repo";
import "./index.css";

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(router);
app.mount("#root");

// Nạp cài đặt rồi tạo preset deck (idempotent).
void (async () => {
  await useSettings().load();
  if (typeof window !== "undefined" && window.db) {
    await ensurePresetDecks(getDb());
  }
})();
```

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npm test`
Expected: tất cả PASS (scheduler 6 + srs.repo 8 + StudySession 1 + các test cũ).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 4: Xác minh end-to-end trong WSL**

Run (từ Windows):
```powershell
wsl -d Ubuntu-24.04 -- bash -c "rsync -a --exclude node_modules --exclude .git --exclude dist /mnt/d/Stack/project/japanese-app/ ~/japanese-app/ && cd ~/japanese-app && npm run build"
wsl -d Ubuntu-24.04 -- pkill -x electron
wsl -d Ubuntu-24.04 -- bash ~/japanese-app/start.sh
```
Kiểm tra trong app:
- Sidebar có nhóm **Ôn tập** → **Từ vựng** / **Kanji**.
- Vào "Từ vựng" → thấy "N5 Từ vựng" với "Mới: 10" (hoặc theo setting) → bấm **Học**.
- Hiện mặt trước → Space hiện đáp án (cách đọc + nghĩa + ví dụ) → bấm Good/phím 3 → sang thẻ kế.
- Quay lại deck → "Đến hạn" tăng theo số thẻ đã tạo; hôm sau thẻ Good đến hạn lại.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat(srs): tạo preset deck lúc khởi động"
```

---

## Self-review (đã rà với spec)

- **§2 phạm vi:** màn Ôn tập + 2 menu con (Task 7) ✓ · 6 deck preset (Task 3) ✓ · 2 thẻ/mục (Task 4) ✓ · scheduler tách riêng (Task 1) ✓ · tạo thẻ lười theo new/ngày (Task 4,6,9) ✓ · Again/Hard/Good/Easy + phím tắt (Task 9) ✓ · reviews log (Task 5) ✓
- **§4 mô hình dữ liệu:** DDL decks/cards/reviews + category + bookmarks_vocab/kanji (Task 2) ✓ · vùng chứa theo kind (Task 4 poolItemIds) ✓
- **§5 scheduler SM-2:** interface + luật đúng (Task 1) ✓
- **§6 repo:** listDecks(category)/getDeckCounts/getDueCards/introduceNewCards/getCardContent/recordReview/ensurePresetDecks (Task 3-5,10) ✓
- **§7 UI:** routes /review/vocab|kanji|session/:deckId (Task 7) ✓ · SrsDecksPage theo :category (Task 8) ✓ · StudySession + useStudyQueue + mặt trước/sau recognition|production + furigana ví dụ (Task 9) ✓
- **§8 settings:** srsNewPerDay (Task 6) ✓
- **§10 kiểm thử:** scheduler unit (Task 1) ✓ · repo DB tạm (Task 3-5) ✓ · StudySession smoke (Task 9) ✓
- **Type nhất quán:** `Rating`/`Card`/`CardContent`/`Deck`/`DeckCategory` định nghĩa Task 2, dùng khớp ở Task 3-9 ✓ · tên hàm `getDeckCounts(db,deckId,newPerDay)` nhất quán Task 4/8/9 ✓
- **Mặt nghĩa VI→EN fallback:** `COALESCE(gloss_vi,gloss_en)` / `meaning_vi ?? meaning_en` (Task 5) ✓
- **"Hôm nay" local:** `date('now','localtime')` + so sánh due ISO (Task 4,5) ✓
