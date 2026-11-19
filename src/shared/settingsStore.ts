import { defineStore } from "pinia";
import { getDb } from "../db/client";
import { getSetting, setSetting } from "../db/user.repo";

export type Theme = "light" | "dark";

interface State {
  theme: Theme;
  fontScale: number;
  ttsRate: number;
  ttsVoiceURI: string;
  srsNewPerDay: number;
  showFurigana: boolean;
  loaded: boolean;
}

export const useSettings = defineStore("settings", {
  state: (): State => ({
    theme: "light",
    fontScale: 1,
    ttsRate: 1,
    ttsVoiceURI: "",
    srsNewPerDay: 10,
    showFurigana: true,
    loaded: false,
  }),
  actions: {
    applyDom() {
      const root = document.documentElement;
      root.classList.toggle("dark", this.theme === "dark");
      root.style.fontSize = `${16 * this.fontScale}px`;
    },
    async load() {
      if (typeof window === "undefined" || !window.db) return;
      const db = getDb();
      const [theme, fontScale, ttsRate, ttsVoiceURI, srsNewPerDay, showFurigana] =
        await Promise.all([
          getSetting(db, "theme"),
          getSetting(db, "fontScale"),
          getSetting(db, "ttsRate"),
          getSetting(db, "ttsVoiceURI"),
          getSetting(db, "srsNewPerDay"),
          getSetting(db, "showFurigana"),
        ]);
      this.theme = (theme as Theme) || "light";
      this.fontScale = fontScale ? Number(fontScale) : 1;
      this.ttsRate = ttsRate ? Number(ttsRate) : 1;
      this.ttsVoiceURI = ttsVoiceURI || "";
      this.srsNewPerDay = srsNewPerDay ? Number(srsNewPerDay) : 10;
      this.showFurigana = showFurigana === null ? true : showFurigana === "1";
      this.applyDom();
      this.loaded = true;
    },
    update(
      patch: Partial<
        Pick<
          State,
          | "theme"
          | "fontScale"
          | "ttsRate"
          | "ttsVoiceURI"
          | "srsNewPerDay"
          | "showFurigana"
        >
      >,
    ) {
      Object.assign(this, patch);
      this.applyDom();
      const db = getDb();
      for (const [k, v] of Object.entries(patch)) {
        void setSetting(db, k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
      }
    },
  },
});
