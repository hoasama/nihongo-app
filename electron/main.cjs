const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

const isDev = !!process.env.VITE_DEV;

// Bảng dữ liệu người dùng (writable) — nằm trong user.sqlite (DB main).
const USER_DDL = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_type, item_id)
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_type, item_id)
);
`;

function resourcePath(file) {
  return app.isPackaged
    ? path.join(process.resourcesPath, file)
    : path.join(__dirname, "..", "resources", file);
}

let db;

function initDb() {
  const userDir = app.getPath("userData");
  fs.mkdirSync(userDir, { recursive: true });

  // seed.sqlite (reference, read-only) copy sang userData lần đầu — tách khỏi
  // user.sqlite để update app không ghi đè dữ liệu người dùng.
  const seedDest = path.join(userDir, "seed.sqlite");
  if (!fs.existsSync(seedDest)) {
    fs.copyFileSync(resourcePath("seed.sqlite"), seedDest);
  }

  db = new Database(path.join(userDir, "user.sqlite"));
  db.pragma("journal_mode = WAL");
  db.exec(USER_DDL);
  // ATTACH seed → bảng words/kanji/... phân giải sang 'seed' khi dùng tên không prefix.
  db.exec(`ATTACH DATABASE '${seedDest.replace(/\\/g, "/")}' AS seed`);
}

// IPC: renderer gọi DB qua các kênh này (xem preload.cjs → window.db).
ipcMain.handle("db:select", (_e, sql, params = []) =>
  db.prepare(sql).all(...params),
);
ipcMain.handle("db:execute", (_e, sql, params = []) => {
  const info = db.prepare(sql).run(...params);
  return { lastInsertRowid: Number(info.lastInsertRowid), changes: info.changes };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    title: "Nihongo — Học tiếng Nhật",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (isDev) {
    win.loadURL("http://localhost:1420");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  initDb();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
