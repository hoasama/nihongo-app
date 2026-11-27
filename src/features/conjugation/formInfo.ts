// Nội dung học cho từng thể: quy tắc theo nhóm, lưu ý, mẫu ngữ pháp liên quan (khớp theo tiêu đề
// trong bảng grammar). Dạng chia thực tế lấy từ conjugate.ts, ở đây chỉ là lời giải thích.
import type { ConjKind } from "../dictionary/conjugate";

export interface FormInfo {
  /** Dùng để làm gì, 1–2 câu */
  use: string;
  /** Quy tắc theo nhóm: động từ g1/g2/g3, tính từ i/na */
  rules: Record<string, string>;
  note?: string;
  /** Tiêu đề mẫu ngữ pháp trong DB (bỏ qua nếu không có) */
  grammar: string[];
}

export const RULE_LABEL: Record<string, string> = {
  g1: "Nhóm I",
  g2: "Nhóm II",
  g3: "Nhóm III",
  i: "Tính từ い",
  na: "Tính từ な",
};

// Từ minh hoạ cho bảng quy tắc: [cách viết, cách đọc, mã JMdict, nhóm quy tắc]
export const EXAMPLES: Record<ConjKind, [string, string, string, string][]> = {
  verb: [
    ["書く", "かく", "&v5k;", "g1"],
    ["飲む", "のむ", "&v5m;", "g1"],
    ["帰る", "かえる", "&v5r;", "g1"],
    ["買う", "かう", "&v5u;", "g1"],
    ["話す", "はなす", "&v5s;", "g1"],
    ["食べる", "たべる", "&v1;", "g2"],
    ["見る", "みる", "&v1;", "g2"],
    ["する", "する", "&vs-i;", "g3"],
    ["来る", "くる", "&vk;", "g3"],
  ],
  adj: [
    ["高い", "たかい", "&adj-i;", "i"],
    ["いい", "いい", "&adj-ix;", "i"],
    ["静か", "しずか", "&adj-na;", "na"],
    ["元気", "げんき", "&adj-na;", "na"],
  ],
};

export const VERB_INFO: Record<string, FormInfo> = {
  dict: {
    use: "Dạng gốc tra trong từ điển, dùng trong văn thường và trước nhiều mẫu ngữ pháp.",
    rules: { g1: "Kết thúc bằng âm hàng う (く, む, る, う...)", g2: "Kết thúc bằng 〜る, âm trước là hàng い/え", g3: "する, 来る（くる）" },
    grammar: ["〜ことができる", "〜前に"],
  },
  masu: {
    use: "Thể lịch sự, dùng khi nói với người không thân hoặc người trên.",
    rules: { g1: "Đổi âm cuối sang hàng い + ます: 書く → 書きます", g2: "Bỏ る + ます: 食べる → 食べます", g3: "する → します, 来る → 来（き）ます" },
    grammar: ["〜ます / 〜ません", "〜ましょう", "〜ませんか", "〜たいです", "〜ながら"],
  },
  masen: {
    use: "Phủ định lịch sự của thể ます.",
    rules: { g1: "Hàng い + ません: 書きません", g2: "Bỏ る + ません: 食べません", g3: "しません, 来（き）ません" },
    grammar: ["〜ます / 〜ません"],
  },
  mashita: {
    use: "Quá khứ lịch sự. Phủ định quá khứ là 〜ませんでした.",
    rules: { g1: "Hàng い + ました: 書きました", g2: "Bỏ る + ました: 食べました", g3: "しました, 来（き）ました" },
    grammar: ["〜ました / 〜ませんでした"],
  },
  te: {
    use: "Nối các hành động, nhờ vả (〜てください), diễn tả trạng thái đang diễn ra (〜ている)...",
    rules: {
      g1: "う・つ・る → って; む・ぶ・ぬ → んで; く → いて; ぐ → いで; す → して",
      g2: "Bỏ る + て: 食べて",
      g3: "して, 来（き）て",
    },
    note: "Ngoại lệ: 行く → 行って (không phải 行いて).",
    grammar: ["〜てください", "〜ている", "〜て (nối hành động)", "〜てもいい", "〜てはいけない", "〜てから"],
  },
  ta: {
    use: "Thể thường quá khứ. Chia giống thể て, chỉ đổi て → た, で → だ.",
    rules: { g1: "って→った, んで→んだ, いて→いた, いで→いだ, して→した", g2: "Bỏ る + た: 食べた", g3: "した, 来（き）た" },
    note: "Ngoại lệ: 行く → 行った.",
    grammar: ["〜た", "〜たことがある", "〜たり〜たりする", "〜後で"],
  },
  nai: {
    use: "Thể thường phủ định.",
    rules: { g1: "Đổi âm cuối sang hàng あ + ない: 書かない. Đuôi う → わない: 買わない", g2: "Bỏ る + ない: 食べない", g3: "しない, 来（こ）ない" },
    note: "Ngoại lệ: ある → ない.",
    grammar: ["〜ない", "〜ないでください", "〜なければならない / 〜なくてはいけない", "〜なくてもいい"],
  },
  nakatta: {
    use: "Phủ định quá khứ thể thường: đổi ない → なかった.",
    rules: { g1: "書かなかった", g2: "食べなかった", g3: "しなかった, 来（こ）なかった" },
    grammar: ["〜ない"],
  },
  pot: {
    use: "Diễn tả khả năng: có thể làm gì. Tân ngữ thường đổi を → が.",
    rules: { g1: "Hàng え + る: 書く → 書ける", g2: "Bỏ る + られる: 食べられる (khẩu ngữ hay nói 食べれる)", g3: "する → できる, 来る → 来（こ）られる" },
    grammar: ["〜える / 〜られる（potential）"],
  },
  vol: {
    use: "Rủ rê (thể thường của 〜ましょう) hoặc ý định (〜ようと思う).",
    rules: { g1: "Hàng お + う: 書こう", g2: "Bỏ る + よう: 食べよう", g3: "しよう, 来（こ）よう" },
    grammar: ["〜おう / 〜よう"],
  },
  ba: {
    use: "Điều kiện \"nếu ... thì\", nhấn vào điều kiện.",
    rules: { g1: "Hàng え + ば: 書けば", g2: "Bỏ る + れば: 食べれば", g3: "すれば, 来（く）れば" },
    grammar: ["〜ば", "〜ばよかった", "〜ば〜ほど"],
  },
  tara: {
    use: "Điều kiện \"nếu / khi ... thì\". Thể た + ら.",
    rules: { g1: "書いたら, 飲んだら", g2: "食べたら", g3: "したら, 来（き）たら" },
    grammar: ["〜たら", "〜たらどう"],
  },
  pass: {
    use: "Bị động: bị / được ai đó làm gì. Cũng dùng làm kính ngữ.",
    rules: { g1: "Hàng あ + れる: 書かれる. Đuôi う → われる: 言われる", g2: "Bỏ る + られる: 食べられる", g3: "される, 来（こ）られる" },
    note: "Nhóm II: dạng bị động trùng với dạng khả năng (食べられる).",
    grammar: ["〜れる / 〜られる（passive）"],
  },
  caus: {
    use: "Sai khiến / cho phép: bắt ai làm, cho ai làm.",
    rules: { g1: "Hàng あ + せる: 書かせる. Đuôi う → わせる", g2: "Bỏ る + させる: 食べさせる", g3: "させる, 来（こ）させる" },
    grammar: ["〜せる / 〜させる"],
  },
  causpass: {
    use: "Bị bắt phải làm gì (ngoài ý muốn).",
    rules: { g1: "Hàng あ + される: 書かされる. Đuôi す → させられる: 話させられる", g2: "Bỏ る + させられる: 食べさせられる", g3: "させられる, 来（こ）させられる" },
    note: "Nhóm I còn dạng đầy đủ 〜せられる (書かせられる), ít dùng hơn trong hội thoại.",
    grammar: ["〜せられる / 〜させられる"],
  },
  imp: {
    use: "Mệnh lệnh mạnh, thô; hay gặp trong biển báo, khẩu hiệu, lời của nam giới.",
    rules: { g1: "Hàng え: 書け", g2: "Bỏ る + ろ: 食べろ", g3: "しろ, 来（こ）い" },
    note: "くれる → くれ; くださる → ください.",
    grammar: ["〜え / 〜ろ"],
  },
  proh: {
    use: "Cấm đoán mạnh: \"đừng / cấm ...\". Thể từ điển + な.",
    rules: { g1: "書くな", g2: "食べるな", g3: "するな, 来（く）るな" },
    grammar: ["〜え / 〜ろ"],
  },
  zu: {
    use: "Phủ định trong văn viết, tương đương 〜ないで: 〜ずに = không làm gì mà ...",
    rules: { g1: "Hàng あ + ず: 書かず", g2: "Bỏ る + ず: 食べず", g3: "する → せず, 来（こ）ず" },
    grammar: ["〜ずに"],
  },
};

export const ADJ_INFO: Record<string, FormInfo> = {
  plain: {
    use: "Dạng gốc. Tính từ な thể thường cần thêm だ khi đứng cuối câu.",
    rules: { i: "Giữ nguyên: 高い", na: "+ だ: 静かだ" },
    grammar: ["〜だ"],
  },
  polite: {
    use: "Lịch sự: thêm です.",
    rules: { i: "高いです", na: "静かです" },
    grammar: ["〜は〜です"],
  },
  neg: {
    use: "Phủ định.",
    rules: { i: "Bỏ い + くない: 高くない", na: "+ じゃない (văn viết: ではない): 静かじゃない" },
    note: "いい → よくない (chia theo よい).",
    grammar: ["〜くない / 〜かった / 〜くなかった", "〜じゃありません"],
  },
  past: {
    use: "Quá khứ.",
    rules: { i: "Bỏ い + かった: 高かった", na: "+ だった: 静かだった" },
    note: "いい → よかった.",
    grammar: ["〜くない / 〜かった / 〜くなかった", "〜でした"],
  },
  pastneg: {
    use: "Phủ định quá khứ.",
    rules: { i: "Bỏ い + くなかった: 高くなかった", na: "+ じゃなかった: 静かじゃなかった" },
    grammar: ["〜くない / 〜かった / 〜くなかった"],
  },
  attr: {
    use: "Đứng trước danh từ để bổ nghĩa.",
    rules: { i: "Giữ nguyên: 高い山", na: "+ な: 静かな町" },
    grammar: ["〜な (tính từ đuôi な)"],
  },
  te: {
    use: "Nối hai tính từ / mệnh đề, hoặc nêu lý do.",
    rules: { i: "Bỏ い + くて: 高くて", na: "+ で: 静かで" },
    grammar: ["〜くて / 〜で", "〜て（reason）"],
  },
  adv: {
    use: "Biến thành phó từ, bổ nghĩa cho động từ; cũng dùng với なる (trở nên).",
    rules: { i: "Bỏ い + く: 高く", na: "+ に: 静かに" },
    grammar: ["〜くなる / 〜になる"],
  },
  ba: {
    use: "Điều kiện \"nếu ...\".",
    rules: { i: "Bỏ い + ければ: 高ければ", na: "+ なら: 静かなら" },
    grammar: ["〜ば", "〜なら"],
  },
  tara: {
    use: "Điều kiện \"nếu / khi ...\".",
    rules: { i: "Bỏ い + かったら: 高かったら", na: "+ だったら: 静かだったら" },
    grammar: ["〜たら"],
  },
  sou: {
    use: "Trông có vẻ ... (đánh giá bằng mắt).",
    rules: { i: "Bỏ い + そう: 高そう", na: "+ そう: 静かそう" },
    note: "いい → よさそう; ない → なさそう.",
    grammar: ["〜そうだ（appearance）"],
  },
  sugi: {
    use: "Quá ... (vượt mức).",
    rules: { i: "Bỏ い + すぎる: 高すぎる", na: "+ すぎる: 静かすぎる" },
    note: "いい → よすぎる.",
    grammar: ["〜すぎる"],
  },
};

export const infoOf = (kind: ConjKind, id: string): FormInfo | undefined =>
  (kind === "verb" ? VERB_INFO : ADJ_INFO)[id];
