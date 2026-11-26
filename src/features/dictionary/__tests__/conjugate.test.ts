// @vitest-environment node
import { describe, it, expect } from "vitest";
import { conjugate } from "../conjugate";

const f = (w: string, k: string, pos: string, id: string) =>
  conjugate(w, k, [pos])?.forms.find((x) => x.id === id);

describe("conjugate", () => {
  it("nhóm I theo đuôi, kể cả る nhóm I (帰る)", () => {
    expect(f("書く", "かく", "&v5k;", "te")?.w).toBe("書いて");
    expect(f("泳ぐ", "およぐ", "&v5g;", "ta")?.w).toBe("泳いだ");
    expect(f("帰る", "かえる", "&v5r;,&vi;", "nai")?.w).toBe("帰らない");
    expect(f("飲む", "のむ", "&v5m;", "pot")?.k).toBe("のめる");
    expect(f("待つ", "まつ", "&v5t;", "vol")?.w).toBe("待とう");
    expect(f("買う", "かう", "&v5u;", "nai")?.w).toBe("買わない");
  });

  it("ngoại lệ nhóm I: 行く, 問う, ある, くださる", () => {
    expect(f("行く", "いく", "&v5k-s;", "te")?.w).toBe("行って");
    expect(f("問う", "とう", "&v5u-s;", "ta")?.w).toBe("問うた");
    expect(f("有る", "ある", "&v5r-i;", "nai")?.k).toBe("ない");
    expect(f("有る", "ある", "&v5r-i;", "pot")).toBeUndefined();
    expect(f("下さる", "くださる", "&v5aru;", "masu")?.k).toBe("くださいます");
    expect(f("下さる", "くださる", "&v5aru;", "imp")?.k).toBe("ください");
  });

  it("nhóm II, くれる, 来る, する, danh từ + する", () => {
    expect(f("食べる", "たべる", "&v1;,&vt;", "pass")?.w).toBe("食べられる");
    expect(f("呉れる", "くれる", "&v1-s;", "imp")?.k).toBe("くれ");
    expect(f("来る", "くる", "&vk;", "nai")).toEqual({ id: "nai", name: "Thể ない (phủ định)", level: "N5", w: "来ない", k: "こない" });
    expect(f("為る", "する", "&vs-i;", "pot")?.k).toBe("できる");
    const t = conjugate("勉強", "べんきょう", ["&n;,&vs;,&vt;"]);
    expect(t?.title).toBe("Chia động từ (+ する)");
    expect(t?.forms.find((x) => x.id === "te")?.w).toBe("勉強して");
  });

  it("sai khiến bị động (N4) và 〜ず (N3)", () => {
    expect(f("書く", "かく", "&v5k;", "causpass")?.w).toBe("書かされる");
    expect(f("話す", "はなす", "&v5s;", "causpass")?.w).toBe("話させられる");
    expect(f("食べる", "たべる", "&v1;", "causpass")?.w).toBe("食べさせられる");
    expect(f("来る", "くる", "&vk;", "causpass")?.k).toBe("こさせられる");
    expect(f("書く", "かく", "&v5k;", "zu")).toMatchObject({ w: "書かず", level: "N3" });
    expect(f("為る", "する", "&vs-i;", "zu")?.k).toBe("せず");
    expect(f("来る", "くる", "&vk;", "zu")?.k).toBe("こず");
  });

  it("tính từ い (kể cả いい → よ) và な", () => {
    expect(f("高い", "たかい", "&adj-i;", "pastneg")?.w).toBe("高くなかった");
    expect(f("いい", "いい", "&adj-ix;", "neg")?.w).toBe("よくない");
    expect(f("いい", "いい", "&adj-ix;", "sou")?.w).toBe("よさそう");
    expect(f("静か", "しずか", "&adj-na;", "attr")?.w).toBe("静かな");
  });

  it("không phải động/tính từ → null; lấy mã chia được đầu tiên trong các nghĩa", () => {
    expect(conjugate("本", "ほん", ["&n;"])).toBeNull();
    expect(conjugate("来る", "くる", [null, "&vk;"])?.group).toBe("Nhóm III");
  });
});
