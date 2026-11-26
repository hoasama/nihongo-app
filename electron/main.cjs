const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

const isDev = !!process.env.VITE_DEV;

// WSL/Linux không có GPU thật và user-namespace sandbox bị hạn chế → Chromium
// crash (GPU process isn't usable error_code=1002 / zygote). --in-process-gpu gộp
// GPU vào main process (không có GPU process riêng để fail), --no-sandbox bỏ zygote
// sandbox. Backup cho trường hợp chạy không qua run-electron.cjs. Chỉ áp cho Linux.
if (process.platform === "linux") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("in-process-gpu");
}

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
    width: 1180,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    center: true,
    title: "Nihongo — Học tiếng Nhật",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Link target=_blank (vd. trang lấy API key) mở bằng trình duyệt mặc định, không mở cửa sổ Electron mới.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
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
