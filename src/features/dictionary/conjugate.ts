// Bảng chia động từ / tính từ. Nhóm lấy từ mã loại từ JMdict (senses.part_of_speech),
// nên không cần đoán theo đuôi (帰る là v5r, 食べる là v1...). Port từ conjugate.js của app cũ.

export type ConjLevel = "N5" | "N4" | "N3";
export type ConjKind = "verb" | "adj";

export interface ConjForm {
  id: string;
  name: string;
  level: ConjLevel;
  /** dạng viết (kanji nếu có) */
  w: string;
  /** dạng kana */
  k: string;
}

export interface ConjTable {
  title: string;
  kind: ConjKind;
  group?: string;
  forms: ConjForm[];
}

// Hàng a, i, e, o, thể て, thể た theo đuôi động từ nhóm I.
const GODAN: Record<string, [string, string, string, string, string, string]> = {
  う: ["わ", "い", "え", "お", "って", "った"],
  く: ["か", "き", "け", "こ", "いて", "いた"],
  ぐ: ["が", "ぎ", "げ", "ご", "いで", "いだ"],
  す: ["さ", "し", "せ", "そ", "して", "した"],
  つ: ["た", "ち", "て", "と", "って", "った"],
  ぬ: ["な", "に", "ね", "の", "んで", "んだ"],
  ぶ: ["ば", "び", "べ", "ぼ", "んで", "んだ"],
  む: ["ま", "み", "め", "も", "んで", "んだ"],
  る: ["ら", "り", "れ", "ろ", "って", "った"],
};
const A = 0, I = 1, E = 2, O = 3, TE = 4, TA = 5, U = -1;
type Row = typeof A | typeof I | typeof E | typeof O | typeof TE | typeof TA | typeof U;

// [id, tên, cấp, nhóm I: [hàng, đuôi], nhóm II: đuôi, する: dạng, 来る: [kana thay cho く, đuôi]]
// Cấp theo dữ liệu ngữ pháp của app (vd sai khiến bị động là N4, 〜ず là N3).
export const VERB_FORMS: [string, string, ConjLevel, [Row, string], string, string, [string, string]][] = [
  ["dict", "Từ điển (辞書形)", "N5", [U, ""], "る", "する", ["く", "る"]],
  ["masu", "Lịch sự (ます形)", "N5", [I, "ます"], "ます", "します", ["き", "ます"]],
  ["masen", "Phủ định lịch sự", "N5", [I, "ません"], "ません", "しません", ["き", "ません"]],
  ["mashita", "Quá khứ lịch sự", "N5", [I, "ました"], "ました", "しました", ["き", "ました"]],
  ["te", "Thể て", "N5", [TE, ""], "て", "して", ["き", "て"]],
  ["ta", "Thể た (quá khứ)", "N5", [TA, ""], "た", "した", ["き", "た"]],
  ["nai", "Thể ない (phủ định)", "N5", [A, "ない"], "ない", "しない", ["こ", "ない"]],
  ["nakatta", "Phủ định quá khứ", "N5", [A, "なかった"], "なかった", "しなかった", ["こ", "なかった"]],
  ["pot", "Khả năng (可能形)", "N4", [E, "る"], "られる", "できる", ["こ", "られる"]],
  ["vol", "Ý chí (意向形)", "N4", [O, "う"], "よう", "しよう", ["こ", "よう"]],
  ["ba", "Điều kiện ば", "N4", [E, "ば"], "れば", "すれば", ["く", "れば"]],
  ["tara", "Điều kiện たら", "N4", [TA, "ら"], "たら", "したら", ["き", "たら"]],
  ["pass", "Bị động (受身形)", "N4", [A, "れる"], "られる", "される", ["こ", "られる"]],
  ["caus", "Sai khiến (使役形)", "N4", [A, "せる"], "させる", "させる", ["こ", "させる"]],
  ["causpass", "Sai khiến bị động", "N4", [A, "される"], "させられる", "させられる", ["こ", "させられる"]],
  ["imp", "Mệnh lệnh (命令形)", "N4", [E, ""], "ろ", "しろ", ["こ", "い"]],
  ["proh", "Cấm chỉ (禁止形)", "N4", [U, "な"], "るな", "するな", ["く", "るな"]],
  ["zu", "Phủ định văn viết (〜ず)", "N3", [A, "ず"], "ず", "せず", ["こ", "ず"]],
];
// ある không dùng các dạng này
const ARU_SKIP = new Set(["pot", "vol", "pass", "caus", "causpass", "imp", "proh"]);

export const ADJ_FORMS: [string, string, ConjLevel][] = [
  ["plain", "Thể thường", "N5"],
  ["polite", "Lịch sự", "N5"],
  ["neg", "Phủ định", "N5"],
  ["past", "Quá khứ", "N5"],
  ["pastneg", "Phủ định quá khứ", "N5"],
  ["attr", "Bổ nghĩa danh từ", "N5"],
  ["te", "Nối câu (て / で)", "N5"],
  ["adv", "Phó từ (く / に)", "N5"],
  ["ba", "Điều kiện ば / なら", "N4"],
  ["tara", "Điều kiện たら", "N4"],
  ["sou", "Trông có vẻ (そう)", "N4"],
  ["sugi", "Quá … (すぎる)", "N4"],
];

type Kind = "godan" | "ichidan" | "suru" | "kuru";
interface Flags {
  iku?: boolean; // v5k-s: 行って
  uS?: boolean; // v5u-s: 問うて
  honor?: boolean; // v5aru: くださいます, ください
  aru?: boolean; // v5r-i: ない
  kure?: boolean; // v1-s: くれ
}

function godan(s: string, row: Row, suffix: string, f: Flags): string {
  if (row === U) return s + suffix;
  let part = GODAN[s.slice(-1)]?.[row];
  if (part === undefined) return s + suffix;
  if (f.honor && (row === I || (row === E && suffix === ""))) part = "い";
  if (f.iku && (row === TE || row === TA)) part = row === TE ? "って" : "った";
  if (f.uS && (row === TE || row === TA)) part = row === TE ? "うて" : "うた";
  return s.slice(0, -1) + part + suffix;
}

function verbForms(w: string, k: string, kind: Kind, f: Flags): ConjForm[] {
  return VERB_FORMS.filter(([id]) => !(f.aru && ARU_SKIP.has(id))).map(
    ([id, name, level, g1, g2, suru, ku]) => {
      let fw: string, fk: string;
      if (f.aru && (id === "nai" || id === "nakatta")) fw = fk = id === "nai" ? "ない" : "なかった";
      else if (kind === "godan") {
        // sai khiến bị động: dạng ngắn 〜される, riêng đuôi す dùng 〜させられる (話させられる)
        const suf = id === "causpass" && k.endsWith("す") ? "せられる" : g1[1];
        fw = godan(w, g1[0], suf, f);
        fk = godan(k, g1[0], suf, f);
      } else if (kind === "ichidan") {
        const end = f.kure && id === "imp" ? "" : g2;
        fw = w.slice(0, -1) + end;
        fk = k.slice(0, -1) + end;
      } else if (kind === "kuru") {
        fk = k.slice(0, -2) + ku[0] + ku[1];
        fw = w === k ? fk : w.slice(0, -2) + "来" + ku[1];
      } else {
        fw = w.slice(0, -2) + suru;
        fk = k.slice(0, -2) + suru;
      }
      return { id, name, level, w: fw, k: fk };
    },
  );
}

function adjForms(w: string, k: string, na: boolean): ConjForm[] {
  const NA: Record<string, string> = {
    plain: "だ", polite: "です", neg: "じゃない", past: "だった", pastneg: "じゃなかった",
    attr: "な", te: "で", adv: "に", ba: "なら", tara: "だったら", sou: "そう", sugi: "すぎる",
  };
  // いい/良い chia theo よい
  const ii = k === "いい" || k === "よい";
  const bw = ii && w === k ? "よ" : w.slice(0, -1);
  const bk = ii ? "よ" : k.slice(0, -1);
  const I_SUF: Record<string, string> = {
    neg: "くない", past: "かった", pastneg: "くなかった", te: "くて", adv: "く",
    ba: "ければ", tara: "かったら", sou: ii ? "さそう" : "そう", sugi: "すぎる",
  };
  return ADJ_FORMS.map(([id, name, level]) => {
    if (na) return { id, name, level, w: w + NA[id], k: k + NA[id] };
    if (id === "plain" || id === "attr") return { id, name, level, w, k };
    if (id === "polite") return { id, name, level, w: w + "です", k: k + "です" };
    return { id, name, level, w: bw + I_SUF[id], k: bk + I_SUF[id] };
  });
}

/** Mã loại từ của một sense, vd "&v5r;,&vi;" → ["v5r", "vi"]. */
const codes = (pos: string | null) => (pos ?? "").split(",").map((c) => c.replace(/[&;]/g, "").trim());

/**
 * Bảng chia cho từ có cách viết `w`, cách đọc `k`, danh sách part_of_speech các nghĩa.
 * Lấy mã chia được đầu tiên; null nếu không phải động từ / tính từ.
 */
export function conjugate(w: string, k: string, posList: (string | null)[]): ConjTable | null {
  const verb = (group: string, forms: ConjForm[], title = "Chia động từ"): ConjTable => ({ title, kind: "verb", group, forms });
  for (const c of posList.flatMap(codes)) {
    if (c === "adj-i" || c === "adj-ix") return { title: "Chia tính từ い", kind: "adj", forms: adjForms(w, k, false) };
    if (c === "adj-na") return { title: "Chia tính từ な", kind: "adj", forms: adjForms(w, k, true) };
    if (c === "v1" || c === "v1-s") return verb("Nhóm II", verbForms(w, k, "ichidan", { kure: c === "v1-s" }));
    if (c === "vk") return verb("Nhóm III", verbForms(w, k, "kuru", {}));
    // shortcut: vs-s (愛する) chia như する, nên phủ định ra 愛しない thay vì 愛さない; thêm nhánh riêng nếu cần.
    if (c === "vs-i" || c === "vs-s") return verb("Nhóm III", verbForms(w, k, "suru", {}));
    if (c === "vs") return verb("Nhóm III", verbForms(w + "する", k + "する", "suru", {}), "Chia động từ (+ する)");
    if (c.startsWith("v5")) {
      const f: Flags = { iku: c === "v5k-s", uS: c === "v5u-s", honor: c === "v5aru", aru: c === "v5r-i" };
      return verb("Nhóm I", verbForms(w, k, "godan", f));
    }
  }
  return null;
}
