import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExecuteResult, Queryable } from "../queryable";

const seedSchema = readFileSync(
  join(process.cwd(), "scripts/build-seed/src/schema.sql"),
  "utf8",
);
const userSchema = readFileSync(
  join(process.cwd(), "src/db/user-schema.sql"),
  "utf8",
);

export interface TestDb {
  q: Queryable;
  raw: DatabaseSync;
}

/**
 * DB :memory: gộp cả bảng seed (words/kanji/...) lẫn bảng user
 * (settings/bookmarks/notes) trong một DB — khớp cách SQLite phân giải tên
 * bảng không prefix ở runtime (main + attached seed).
 */
export function makeTestDb(): TestDb {
  const db = new DatabaseSync(":memory:");
  db.exec(seedSchema);
  db.exec(userSchema);

  const q: Queryable = {
    select: async <T>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).all(...(params as never[])) as T[],
    execute: async (sql: string, params: unknown[] = []): Promise<ExecuteResult> => {
      const r = db.prepare(sql).run(...(params as never[]));
      return {
        lastInsertRowid: Number(r.lastInsertRowid),
        changes: Number(r.changes),
      };
    },
  };
  return { q, raw: db };
}
