const { spawn } = require("node:child_process");

// Một số môi trường (vd harness) set ELECTRON_RUN_AS_NODE=1 khiến Electron chạy
// như Node thuần (thiếu app/BrowserWindow). XOÁ HẲN biến (set rỗng gây spawn
// UNKNOWN trên Windows), rồi mới mở Electron.
delete process.env.ELECTRON_RUN_AS_NODE;

// Ở ngữ cảnh Node, require('electron') trả về đường dẫn tới electron.exe.
const electronPath = require("electron");

const child = spawn(electronPath, ["electron/main.cjs"], {
  stdio: "inherit",
  env: process.env,
  windowsHide: false,
});
child.on("close", (code) => process.exit(code ?? 0));
