import { theme as antTheme } from "antdv-next";
import type { Theme } from "../shared/settingsStore";

// Font: Segoe UI cho tiếng Việt/Latin, Yu Gothic cho tiếng Nhật.
const UI_FONT =
  '"Segoe UI", "Inter", "Noto Sans", "Yu Gothic UI", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif';

// Tiffany làm nền accent ở cả 2 mode, chữ tối trên nền đó.
const ACCENT = "#81d8d0";

/** Theme Ant Design khớp palette pastel trong index.css
 *  (Tiffany · Lilac · Pink · Cream · Slate). Light: nền cream, sidebar slate.
 *  Dark: nền slate làm tối. Chữ/link màu accent ở light dùng teal đậm (Tiffany quá nhạt). */
export function antdThemeConfig(mode: Theme) {
  const dark = mode === "dark";
  const side = dark ? "#1b1d2b" : "#4a4e69";
  const accentInk = dark ? "#1b1d2b" : "#2e3147"; // chữ nằm TRÊN nền accent
  const accentText = dark ? ACCENT : "#0c6170";
  const bg = dark ? "#232536" : "#fff1e6";
  // Nút primary + mục segmented đang chọn: tông pastel (Tiffany nhạt + chữ teal đậm)
  const pastel = dark
    ? { bg: "#2f4f57", hover: "#36606a", active: "#3e6f7a", text: "#a9ece6" }
    : { bg: "#c6edea", hover: "#b4e6e2", active: "#a2dfda", text: "#0c6170" };
  return {
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: ACCENT,
      colorInfo: ACCENT,
      colorLink: accentText,
      colorTextLightSolid: accentInk, // chữ trên nút primary
      borderRadius: 12,
      fontFamily: UI_FONT,
      fontSize: 15,
      colorBgLayout: bg,
      // darkAlgorithm mặc định dùng nền đen trung tính (#141414) cho nút, ô nhập,
      // dropdown… → lệch tông slate. Đặt theo palette slate.
      ...(dark && {
        colorBgContainer: "#2c2f44",
        colorBgElevated: "#34374d",
        colorBorder: "#4a4e69",
        colorBorderSecondary: "#3b3f58",
      }),
    },
    components: {
      Layout: {
        siderBg: side,
        bodyBg: bg,
      },
      Menu: {
        darkItemBg: side,
        darkSubMenuItemBg: side,
        darkPopupBg: side,
        darkItemColor: "#e4e5ef",
        darkItemHoverColor: "#ffffff",
        darkItemHoverBg: "rgba(255,255,255,0.08)",
        darkItemSelectedBg: "rgba(129,216,208,0.18)", // Tiffany tô nhẹ
        darkItemSelectedColor: "#ffffff",
        darkGroupTitleColor: "rgba(228,229,239,0.6)",
        itemBorderRadius: 12,
        iconSize: 16,
      },
      Segmented: {
        // nền rãnh trong suốt nhẹ: trông giống nhau trên nền cream lẫn trên thẻ trắng
        trackBg: dark ? "rgba(255,255,255,0.06)" : "rgba(46,49,71,0.06)",
        itemSelectedBg: pastel.bg,
        itemSelectedColor: pastel.text,
      },
      Button: {
        // màu nền nút primary lấy từ colorPrimary của riêng Button
        colorPrimary: pastel.bg,
        colorPrimaryHover: pastel.hover,
        colorPrimaryActive: pastel.active,
        primaryColor: pastel.text,
        primaryShadow: "none",
      },
      Card: {
        borderRadiusLG: 16,
      },
      // Tag thường (loại từ…): dark mặc định ra nền tối, chữ mờ → nền sáng, chữ slate
      ...(dark && { Tag: { defaultBg: "#e4e5ef", defaultColor: "#2e3147" } }),
    },
  };
}
