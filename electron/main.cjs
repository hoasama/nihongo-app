const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

const isDev = !!process.env.VITE_DEV;

// DDL bảng người dùng dùng chung với test (src/db/user-schema.sql).
const USER_DDL = fs.readFileSync(
  path.join(__dirname, "..", "src", "db", "user-schema.sql"),
  "utf8",
);

function resourcePath(file) {
  return app.isPackaged
    ? path.join(process.resourcesPath, file)
    : path.join(__dirname, "..", "resources", file);
}

let db;

function initDb() {
  const userDir = app.getPath("userData");
  fs.mkdirSync(userDir, { recursive: true });

  // seed.sqlite (reference, read-only) copy sang userData — tách khỏi
  // user.sqlite để update app không ghi đè dữ liệu người dùng. Nạp lại khi
  // bản seed đóng gói mới hơn (vd sau khi chạy build:seed).
  const seedSrc = resourcePath("seed.sqlite");
  const seedDest = path.join(userDir, "seed.sqlite");
  const needCopy =
    !fs.existsSync(seedDest) ||
    fs.statSync(seedSrc).mtimeMs > fs.statSync(seedDest).mtimeMs;
  if (needCopy) {
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        fs.rmSync(seedDest + suffix, { force: true });
      } catch {
        /* ignore */
      }
    }
    fs.copyFileSync(seedSrc, seedDest);
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
