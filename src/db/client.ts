import type { Queryable } from "./queryable";

declare global {
  interface Window {
    db: Queryable;
  }
}

/** DB của app (do preload Electron cung cấp qua window.db). */
export function getDb(): Queryable {
  return window.db;
}
