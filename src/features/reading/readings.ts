// Bài đọc soạn sẵn cho Luyện đọc. Thân câu dùng markup furigana "{漢字|かな}"
// (khớp FuriganaText); romaji suy từ kana lúc chạy nên không lưu ở đây.
// NỘI DUNG KHỞI ĐẦU — cần người rà lại trước khi dùng để học thật.

export type ReadingLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface ReadingSentence {
  jp: string; // markup furigana
  vi: string;
}

export interface Reading {
  id: string;
  level: ReadingLevel;
  titleJp: string;
  titleVi: string;
  sentences: ReadingSentence[];
}

export const READINGS: Reading[] = [
  {
    id: "n5-watashi-no-ichinichi",
    level: "N5",
    titleJp: "私の一日",
    titleVi: "Một ngày của tôi",
    sentences: [
      { jp: "{私|わたし}は{毎朝|まいあさ}{六時|ろくじ}に{起|お}きます。", vi: "Mỗi sáng tôi dậy lúc 6 giờ." },
      { jp: "{朝|あさ}ご{飯|はん}を{食|た}べてから、{電車|でんしゃ}で{会社|かいしゃ}へ{行|い}きます。", vi: "Sau khi ăn sáng, tôi đi làm bằng tàu điện." },
      { jp: "{会社|かいしゃ}は{九時|くじ}から{五時|ごじ}までです。", vi: "Công ty làm việc từ 9 giờ đến 5 giờ." },
      { jp: "{昼|ひる}は{同僚|どうりょう}と{一緒|いっしょ}に{食堂|しょくどう}で{食|た}べます。", vi: "Buổi trưa tôi ăn ở nhà ăn cùng đồng nghiệp." },
      { jp: "{夜|よる}はうちで{日本語|にほんご}を{勉強|べんきょう}します。", vi: "Buổi tối tôi học tiếng Nhật ở nhà." },
      { jp: "{十一時|じゅういちじ}に{寝|ね}ます。", vi: "Tôi đi ngủ lúc 11 giờ." },
    ],
  },
  {
    id: "n5-watashi-no-kazoku",
    level: "N5",
    titleJp: "私の家族",
    titleVi: "Gia đình của tôi",
    sentences: [
      { jp: "{私|わたし}の{家族|かぞく}は{四人|よにん}です。", vi: "Gia đình tôi có 4 người." },
      { jp: "{父|ちち}と{母|はは}と{姉|あね}と{私|わたし}です。", vi: "Gồm bố, mẹ, chị gái và tôi." },
      { jp: "{父|ちち}は{会社員|かいしゃいん}です。", vi: "Bố tôi là nhân viên công ty." },
      { jp: "{母|はは}は{看護師|かんごし}です。", vi: "Mẹ tôi là y tá." },
      { jp: "{姉|あね}は{大学生|だいがくせい}です。", vi: "Chị gái tôi là sinh viên đại học." },
      { jp: "{私|わたし}たちは{犬|いぬ}も{飼|か}っています。", vi: "Nhà tôi còn nuôi một con chó." },
    ],
  },
  {
    id: "n4-hajimete-no-nihon-ryokou",
    level: "N4",
    titleJp: "初めての日本旅行",
    titleVi: "Chuyến du lịch Nhật đầu tiên",
    sentences: [
      { jp: "{去年|きょねん}、{初|はじ}めて{日本|にほん}へ{旅行|りょこう}に{行|い}きました。", vi: "Năm ngoái, lần đầu tiên tôi đi du lịch Nhật Bản." },
      { jp: "{東京|とうきょう}と{京都|きょうと}を{見|み}ることができました。", vi: "Tôi đã được tham quan Tokyo và Kyoto." },
      { jp: "{京都|きょうと}では{古|ふる}いお{寺|てら}がたくさんありました。", vi: "Ở Kyoto có rất nhiều ngôi chùa cổ." },
      { jp: "{電車|でんしゃ}がとても{便利|べんり}で、どこへでも{行|い}けました。", vi: "Tàu điện rất tiện, đi đâu cũng được." },
      { jp: "また{日本|にほん}へ{行|い}きたいです。", vi: "Tôi muốn đi Nhật thêm lần nữa." },
    ],
  },
  {
    id: "n4-kenkou-no-tame-ni",
    level: "N4",
    titleJp: "健康のために",
    titleVi: "Vì sức khỏe",
    sentences: [
      { jp: "{健康|けんこう}のために、{毎日|まいにち}{運動|うんどう}をしています。", vi: "Vì sức khỏe, tôi tập thể dục mỗi ngày." },
      { jp: "{朝|あさ}{早|はや}く{起|お}きて、{公園|こうえん}を{走|はし}ります。", vi: "Tôi dậy sớm và chạy ở công viên." },
      { jp: "{野菜|やさい}をたくさん{食|た}べるようにしています。", vi: "Tôi cố ăn thật nhiều rau." },
      { jp: "お{酒|さけ}はあまり{飲|の}まないほうがいいと{思|おも}います。", vi: "Tôi nghĩ không nên uống nhiều rượu." },
      { jp: "{体|からだ}が{元気|げんき}だと、{仕事|しごと}も{楽|たの}しくなります。", vi: "Khi cơ thể khỏe, công việc cũng vui hơn." },
    ],
  },
  {
    id: "n3-nihon-no-shiki",
    level: "N3",
    titleJp: "日本の四季",
    titleVi: "Bốn mùa ở Nhật Bản",
    sentences: [
      { jp: "{日本|にほん}には{四|よっ}つの{季節|きせつ}があります。", vi: "Nhật Bản có bốn mùa." },
      { jp: "{春|はる}には{桜|さくら}が{咲|さ}いて、とてもきれいです。", vi: "Mùa xuân hoa anh đào nở, rất đẹp." },
      { jp: "{夏|なつ}は{暑|あつ}くて、{海|うみ}へ{泳|およ}ぎに{行|い}く{人|ひと}が{多|おお}いです。", vi: "Mùa hè nóng, nhiều người ra biển tắm." },
      { jp: "{秋|あき}は{紅葉|こうよう}が{美|うつく}しく、{食|た}べ{物|もの}もおいしいです。", vi: "Mùa thu lá đỏ đẹp, đồ ăn cũng ngon." },
      { jp: "{冬|ふゆ}は{雪|ゆき}が{降|ふ}る{地方|ちほう}もあります。", vi: "Mùa đông, có những vùng còn có tuyết rơi." },
    ],
  },
  {
    id: "n2-hatarakikata-no-henka",
    level: "N2",
    titleJp: "働き方の変化",
    titleVi: "Sự thay đổi trong cách làm việc",
    sentences: [
      { jp: "{最近|さいきん}、{働|はたら}き{方|かた}が{大|おお}きく{変|か}わってきました。", vi: "Gần đây, cách làm việc đã thay đổi nhiều." },
      { jp: "{家|いえ}で{仕事|しごと}をする{人|ひと}が{増|ふ}えています。", vi: "Số người làm việc tại nhà đang tăng lên." },
      { jp: "{通勤|つうきん}の{時間|じかん}が{減|へ}って、{生活|せいかつ}が{楽|らく}になりました。", vi: "Thời gian đi làm giảm, cuộc sống thoải mái hơn." },
      { jp: "しかし、{同僚|どうりょう}と{会|あ}う{機会|きかい}は{少|すく}なくなりました。", vi: "Nhưng cơ hội gặp đồng nghiệp lại ít đi." },
      { jp: "{自由|じゆう}と{責任|せきにん}のバランスが{大切|たいせつ}だと{思|おも}います。", vi: "Tôi nghĩ cân bằng giữa tự do và trách nhiệm là điều quan trọng." },
    ],
  },
  {
    id: "n1-kankyou-mondai",
    level: "N1",
    titleJp: "環境問題と私たち",
    titleVi: "Vấn đề môi trường và chúng ta",
    sentences: [
      { jp: "{地球|ちきゅう}の{温暖化|おんだんか}は、{世界中|せかいじゅう}で{深刻|しんこく}な{問題|もんだい}になっています。", vi: "Sự nóng lên toàn cầu đang trở thành vấn đề nghiêm trọng khắp thế giới." },
      { jp: "{異常|いじょう}{気象|きしょう}によって、{農業|のうぎょう}にも{大|おお}きな{影響|えいきょう}が{出|で}ています。", vi: "Thời tiết bất thường gây ảnh hưởng lớn đến cả nông nghiệp." },
      { jp: "{一人|ひとり}ひとりの{努力|どりょく}が、{未来|みらい}を{変|か}える{力|ちから}になります。", vi: "Nỗ lực của từng người sẽ thành sức mạnh thay đổi tương lai." },
      { jp: "{便利|べんり}さだけを{求|もと}める{時代|じだい}は、もう{終|お}わりつつあります。", vi: "Thời đại chỉ theo đuổi sự tiện lợi đang dần kết thúc." },
      { jp: "{私|わたし}たちは、{次|つぎ}の{世代|せだい}のために{行動|こうどう}しなければなりません。", vi: "Chúng ta phải hành động vì thế hệ sau." },
    ],
  },
];
