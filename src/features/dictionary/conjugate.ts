// Bảng chia động từ / tính từ. Nhóm lấy từ mã loại từ JMdict (senses.part_of_speech),
// nên không cần đoán theo đuôi (帰る là v5r, 食べる là v1...). Port từ conjugate.js của app cũ.

export interface ConjForm {
  id: string;
  name: string;
  /** dạng viết (kanji nếu có) */
  w: string;
  /** dạng kana */
  k: string;
}

export interface ConjTable {
  title: string;
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

// [id, tên, nhóm I: [hàng, đuôi], nhóm II: đuôi, する: dạng, 来る: [kana thay cho く, đuôi]]
const VERB_FORMS: [string, string, [Row, string], string, string, [string, string]][] = [
  ["dict", "Từ điển (辞書形)", [U, ""], "る", "する", ["く", "る"]],
  ["masu", "Lịch sự (ます形)", [I, "ます"], "ます", "します", ["き", "ます"]],
  ["masen", "Phủ định lịch sự", [I, "ません"], "ません", "しません", ["き", "ません"]],
  ["mashita", "Quá khứ lịch sự", [I, "ました"], "ました", "しました", ["き", "ました"]],
  ["te", "Thể て", [TE, ""], "て", "して", ["き", "て"]],
  ["ta", "Thể た (quá khứ)", [TA, ""], "た", "した", ["き", "た"]],
  ["nai", "Thể ない (phủ định)", [A, "ない"], "ない", "しない", ["こ", "ない"]],
  ["nakatta", "Phủ định quá khứ", [A, "なかった"], "なかった", "しなかった", ["こ", "なかった"]],
  ["pot", "Khả năng (可能形)", [E, "る"], "られる", "できる", ["こ", "られる"]],
  ["vol", "Ý chí (意向形)", [O, "う"], "よう", "しよう", ["こ", "よう"]],
  ["ba", "Điều kiện ば", [E, "ば"], "れば", "すれば", ["く", "れば"]],
  ["tara", "Điều kiện たら", [TA, "ら"], "たら", "したら", ["き", "たら"]],
  ["pass", "Bị động (受身形)", [A, "れる"], "られる", "される", ["こ", "られる"]],
  ["caus", "Sai khiến (使役形)", [A, "せる"], "させる", "させる", ["こ", "させる"]],
  ["imp", "Mệnh lệnh (命令形)", [E, ""], "ろ", "しろ", ["こ", "い"]],
  ["proh", "Cấm chỉ (禁止形)", [U, "な"], "るな", "するな", ["く", "るな"]],
];
// ある không dùng các dạng này
const ARU_SKIP = new Set(["pot", "vol", "pass", "caus", "imp", "proh"]);

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
    ([id, name, g1, g2, suru, ku]) => {
      let fw: string, fk: string;
      if (f.aru && (id === "nai" || id === "nakatta")) fw = fk = id === "nai" ? "ない" : "なかった";
      else if (kind === "godan") {
        fw = godan(w, g1[0], g1[1], f);
        fk = godan(k, g1[0], g1[1], f);
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
      return { id, name, w: fw, k: fk };
    },
  );
}

function adjForms(w: string, k: string, na: boolean): ConjForm[] {
  if (na) {
    return (
      [
        ["plain", "Thể thường", "だ"],
        ["polite", "Lịch sự", "です"],
        ["neg", "Phủ định", "じゃない"],
        ["past", "Quá khứ", "だった"],
        ["pastneg", "Phủ định quá khứ", "じゃなかった"],
        ["attr", "Bổ nghĩa danh từ", "な"],
        ["te", "Nối câu (で)", "で"],
        ["adv", "Phó từ (に)", "に"],
        ["nara", "Điều kiện なら", "なら"],
        ["tara", "Điều kiện たら", "だったら"],
        ["sou", "Trông có vẻ (そう)", "そう"],
        ["sugi", "Quá … (すぎる)", "すぎる"],
      ] as const
    ).map(([id, name, suf]) => ({ id, name, w: w + suf, k: k + suf }));
  }
  // いい/良い chia theo よい
  const ii = k === "いい" || k === "よい";
  const bw = ii && w === k ? "よ" : w.slice(0, -1);
  const bk = ii ? "よ" : k.slice(0, -1);
  return (
    [
      ["plain", "Thể thường", null],
      ["polite", "Lịch sự", null],
      ["neg", "Phủ định", "くない"],
      ["past", "Quá khứ", "かった"],
      ["pastneg", "Phủ định quá khứ", "くなかった"],
      ["te", "Nối câu (くて)", "くて"],
      ["adv", "Phó từ (く)", "く"],
      ["ba", "Điều kiện ば", "ければ"],
      ["tara", "Điều kiện たら", "かったら"],
      ["sou", "Trông có vẻ (そう)", ii ? "さそう" : "そう"],
      ["sugi", "Quá … (すぎる)", "すぎる"],
    ] as const
  ).map(([id, name, suf]) =>
    id === "plain"
      ? { id, name, w, k }
      : id === "polite"
        ? { id, name, w: w + "です", k: k + "です" }
        : { id, name, w: bw + suf, k: bk + suf },
  );
}

/** Mã loại từ của một sense, vd "&v5r;,&vi;" → ["v5r", "vi"]. */
const codes = (pos: string | null) => (pos ?? "").split(",").map((c) => c.replace(/[&;]/g, "").trim());

/**
 * Bảng chia cho từ có cách viết `w`, cách đọc `k`, danh sách part_of_speech các nghĩa.
 * Lấy mã chia được đầu tiên; null nếu không phải động từ / tính từ.
 */
export function conjugate(w: string, k: string, posList: (string | null)[]): ConjTable | null {
  for (const c of posList.flatMap(codes)) {
    if (c === "adj-i" || c === "adj-ix") return { title: "Chia tính từ い", forms: adjForms(w, k, false) };
    if (c === "adj-na") return { title: "Chia tính từ な", forms: adjForms(w, k, true) };
    if (c === "v1" || c === "v1-s")
      return { title: "Chia động từ", group: "Nhóm II", forms: verbForms(w, k, "ichidan", { kure: c === "v1-s" }) };
    if (c === "vk") return { title: "Chia động từ", group: "Nhóm III", forms: verbForms(w, k, "kuru", {}) };
    // shortcut: vs-s (愛する) chia như する, nên phủ định ra 愛しない thay vì 愛さない; thêm nhánh riêng nếu cần.
    if (c === "vs-i" || c === "vs-s")
      return { title: "Chia động từ", group: "Nhóm III", forms: verbForms(w, k, "suru", {}) };
    if (c === "vs")
      return { title: "Chia động từ (+ する)", group: "Nhóm III", forms: verbForms(w + "する", k + "する", "suru", {}) };
    if (c.startsWith("v5")) {
      const f: Flags = { iku: c === "v5k-s", uS: c === "v5u-s", honor: c === "v5aru", aru: c === "v5r-i" };
      return { title: "Chia động từ", group: "Nhóm I", forms: verbForms(w, k, "godan", f) };
    }
  }
  return null;
}
