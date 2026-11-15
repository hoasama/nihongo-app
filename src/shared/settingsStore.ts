import { create } from "zustand";
import { getDb } from "../db/client";
import { getSetting, setSetting } from "../db/user.repo";

export type Theme = "light" | "dark";

interface SettingsState {
  theme: Theme;
  fontScale: number;
  ttsRate: number;
  ttsVoiceURI: string;
  loaded: boolean;
  load: () => Promise<void>;
  update: (
    patch: Partial<
      Pick<SettingsState, "theme" | "fontScale" | "ttsRate" | "ttsVoiceURI">
    >,
  ) => void;
}

function applyDom(theme: Theme, fontScale: number) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.fontSize = `${16 * fontScale}px`;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: "dark",
  fontScale: 1,
  ttsRate: 1,
  ttsVoiceURI: "",
  loaded: false,

  load: async () => {
    if (typeof window === "undefined" || !window.db) return;
    const db = getDb();
    const [theme, fontScale, ttsRate, ttsVoiceURI] = await Promise.all([
      getSetting(db, "theme"),
      getSetting(db, "fontScale"),
      getSetting(db, "ttsRate"),
      getSetting(db, "ttsVoiceURI"),
    ]);
    const next = {
      theme: (theme as Theme) || "dark",
      fontScale: fontScale ? Number(fontScale) : 1,
      ttsRate: ttsRate ? Number(ttsRate) : 1,
      ttsVoiceURI: ttsVoiceURI || "",
    };
    applyDom(next.theme, next.fontScale);
    set({ ...next, loaded: true });
  },

  update: (patch) => {
    const merged = { ...get(), ...patch };
    applyDom(merged.theme, merged.fontScale);
    set(patch);
    const db = getDb();
    for (const [k, v] of Object.entries(patch)) {
      void setSetting(db, k, String(v));
    }
  },
}));
