const { contextBridge, ipcRenderer } = require("electron");

// window.db — cổng DB duy nhất cho renderer, khớp interface Queryable.
contextBridge.exposeInMainWorld("db", {
  select: (sql, params) => ipcRenderer.invoke("db:select", sql, params),
  execute: (sql, params) => ipcRenderer.invoke("db:execute", sql, params),
});
