import { theme as antTheme } from "antdv-next";
import type { Theme } from "../shared/settingsStore";

// Font: Segoe UI cho tiếng Việt/Latin, Yu Gothic cho tiếng Nhật.
const UI_FONT =
  '"Segoe UI", "Inter", "Noto Sans", "Yu Gothic UI", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif';

const ACCENT = "#8b5cf6";
const NAVY = "#2a2550";

/** Theme Ant Design khớp palette lilac trong index.css (sidebar tím + accent lilac). */
export function antdThemeConfig(mode: Theme) {
  const dark = mode === "dark";
  return {
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: ACCENT,
      colorInfo: ACCENT,
      colorLink: ACCENT,
      borderRadius: 10,
      fontFamily: UI_FONT,
      fontSize: 15,
      colorBgLayout: dark ? "#12131f" : "#f4f5fb",
    },
    components: {
      Layout: {
        siderBg: NAVY,
        bodyBg: dark ? "#12131f" : "#f4f5fb",
      },
      Menu: {
        darkItemBg: NAVY,
        darkSubMenuItemBg: NAVY,
        darkPopupBg: NAVY,
        darkItemColor: "#c9cce3",
        darkItemHoverColor: "#ffffff",
        darkItemHoverBg: "rgba(255,255,255,0.08)",
        darkItemSelectedBg: ACCENT,
        darkItemSelectedColor: "#ffffff",
        darkGroupTitleColor: "rgba(201,204,227,0.6)",
        itemBorderRadius: 10,
        iconSize: 16,
      },
      Segmented: {
        itemSelectedBg: ACCENT,
        itemSelectedColor: "#ffffff",
      },
      Card: {
        borderRadiusLG: 12,
      },
    },
  };
}
