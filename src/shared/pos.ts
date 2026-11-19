// Loại từ (part of speech) — map mã entity JMdict ("&n;", "&v5r;"…) sang tiếng Việt,
// và danh sách category để lọc ở trang Tra từ.

export type WordType = "all" | "n" | "v" | "adj-i" | "adj-na" | "adv" | "exp";

export const WORD_TYPES: { v: WordType; label: string }[] = [
  { v: "all", label: "Mọi loại từ" },
  { v: "n", label: "Danh từ" },
  { v: "v", label: "Động từ" },
  { v: "adj-i", label: "Tính từ い" },
  { v: "adj-na", label: "Tính từ な" },
  { v: "adv", label: "Phó từ" },
  { v: "exp", label: "Cụm từ / khác" },
];

// Mẫu LIKE khớp mã entity trong cột senses.part_of_speech (vd "&n;,&vs;,&vi;").
export const POS_LIKE: Record<Exclude<WordType, "all">, string[]> = {
  n: ["%&n;%", "%&pn;%", "%&n-suf;%", "%&n-pref;%"],
  v: [
    "%&v1;%",
    "%&v5%",
    "%&vs;%",
    "%&vs-%",
    "%&vk;%",
    "%&vz;%",
    "%&vn;%",
    "%&vr;%",
    "%&iv;%",
  ],
  "adj-i": ["%&adj-i;%", "%&adj-ix;%"],
  "adj-na": ["%&adj-na;%"],
  adv: ["%&adv;%", "%&adv-to;%"],
  exp: ["%&exp;%", "%&int;%", "%&conj;%", "%&prt;%", "%&aux%", "%&cop%"],
};

// Nhãn hiển thị cho từng mã (đã bỏ & và ;).
const POS_LABEL: Record<string, string> = {
  n: "Danh từ",
  pn: "Đại từ",
  "n-suf": "Hậu tố",
  "n-pref": "Tiền tố",
  "n-adv": "Phó từ",
  v1: "Động từ",
  v5: "Động từ",
  vk: "Động từ",
  vz: "Động từ",
  vs: "Động từ (する)",
  iv: "Động từ bất quy tắc",
  "adj-i": "Tính từ い",
  "adj-ix": "Tính từ い",
  "adj-na": "Tính từ な",
  "adj-no": "Tính từ の",
  "adj-f": "Tính từ",
  "adj-t": "Tính từ",
  adv: "Phó từ",
  "adv-to": "Phó từ",
  exp: "Cụm từ",
  int: "Thán từ",
  conj: "Liên từ",
  prt: "Trợ từ",
  suf: "Hậu tố",
  pref: "Tiền tố",
  ctr: "Lượng từ",
  num: "Số từ",
  aux: "Trợ",
  "aux-v": "Trợ động từ",
  "aux-adj": "Trợ tính từ",
  cop: "Hệ từ",
};

// Mã bỏ qua khi hiển thị (tính bắc cầu, không phải loại từ) cho gọn.
const SKIP = new Set(["vi", "vt"]);

/** "&n;,&vs;,&vi;" → "Danh từ · Động từ (する)" */
export function formatPos(raw: string | null | undefined): string {
  if (!raw) return "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of raw.split(",")) {
    const code = tok.replace(/[&;]/g, "").trim();
    if (!code || SKIP.has(code)) continue;
    const key = /^v5/.test(code) ? "v5" : code;
    const label = POS_LABEL[key] ?? POS_LABEL[code] ?? code;
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out.join(" · ");
}

/** Loại từ chính (badge): phần tử đầu của formatPos. */
export function primaryPos(raw: string | null | undefined): string {
  const s = formatPos(raw);
  return s ? s.split(" · ")[0] : "";
}
