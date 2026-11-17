const { spawn } = require("node:child_process");

// Một số môi trường (vd harness) set ELECTRON_RUN_AS_NODE=1 khiến Electron chạy
// như Node thuần (thiếu app/BrowserWindow). XOÁ HẲN biến (set rỗng gây spawn
// UNKNOWN trên Windows), rồi mới mở Electron.
delete process.env.ELECTRON_RUN_AS_NODE;

// Ở ngữ cảnh Node, require('electron') trả về đường dẫn tới electron.exe.
const electronPath = require("electron");

// Trên Linux/WSL: không có GPU thật + sandbox namespace bị hạn chế. --in-process-gpu
// gộp xử lý GPU vào main process (không spawn GPU process riêng — thứ bị crash
// error_code=1002 trong WSL); --no-sandbox bỏ zygote sandbox. Truyền qua CLI cho
// chắc (đáng tin hơn appendSwitch trong main).
const linuxFlags =
  process.platform === "linux"
    ? ["--no-sandbox", "--in-process-gpu", "--disable-dev-shm-usage"]
    : [];

const child = spawn(electronPath, [...linuxFlags, "electron/main.cjs"], {
  stdio: "inherit",
  env: process.env,
  windowsHide: false,
});
child.on("error", (err) => {
  console.error("Không mở được Electron:", err.message);
  process.exit(1);
});
child.on("close", (code) => process.exit(code ?? 0));
