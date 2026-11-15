// Giao diện truy cập DB tối giản, tách tầng khỏi engine cụ thể.
// Runtime: better-sqlite3 ở Electron main (qua IPC). Test: better-sqlite3 trực tiếp.
export interface ExecuteResult {
  lastInsertRowid: number;
  changes: number;
}

export interface Queryable {
  select<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
}
