import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Providers } from "./app/providers";
import { router } from "./app/router";
import { useSettings } from "./shared/settingsStore";
import "./index.css";

// Nạp cài đặt (theme, cỡ chữ, TTS) từ DB rồi áp dụng.
void useSettings.getState().load();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>,
);
