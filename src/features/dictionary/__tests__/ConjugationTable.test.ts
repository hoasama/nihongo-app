// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ConjugationTable from "../ConjugationTable.vue";

const SpeakButton = { props: ["text"], template: "<button />" };
const mountWith = (headword: string, reading_kana: string, pos: string) =>
  mount(ConjugationTable, {
    props: { word: { headword, reading_kana, senses: [{ part_of_speech: pos, gloss_en: "", gloss_vi: null }] } },
    global: { stubs: { SpeakButton, LevelTag: true, RouterLink: { template: "<a><slot /></a>" } } },
  });

describe("ConjugationTable", () => {
  it("hiện bảng chia cho động từ", () => {
    const w = mountWith("食べる", "たべる", "&v1;,&vt;");
    expect(w.text()).toContain("Chia động từ");
    expect(w.text()).toContain("Nhóm II");
    expect(w.text()).toContain("食べて");
    expect(w.findAll("tr")).toHaveLength(18);
  });

  it("không render gì với danh từ", () => {
    expect(mountWith("本", "ほん", "&n;").find("details").exists()).toBe(false);
  });
});
