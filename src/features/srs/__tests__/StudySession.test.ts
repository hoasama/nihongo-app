// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Card, CardContent } from "../../../shared/types";

const { card, content, recordReview } = vi.hoisted(() => {
  const card: Card = {
    id: 1, deck_id: 1, item_type: "word", item_id: 1, direction: "recognition",
    ease_factor: 2.5, interval_days: 0, repetitions: 0, lapses: 0, due: "2026-01-01T00:00:00.000Z",
  };
  const content: CardContent = {
    cardId: 1, itemType: "word", direction: "recognition",
    japanese: "食べる", reading: "たべる", meaning: "ăn",
    exampleJp: null, exampleFurigana: null, exampleEn: null, strokeCount: null,
  };
  const recordReview = vi.fn().mockResolvedValue(undefined);
  return { card, content, recordReview };
});

vi.mock("../../../db/client", () => ({ getDb: () => ({}) }));
vi.mock("../../../db/srs.repo", () => ({
  getDeckCounts: vi.fn().mockResolvedValue({ due: 1, newRemaining: 0 }),
  getDueCards: vi.fn().mockResolvedValue([card]),
  introduceNewCards: vi.fn().mockResolvedValue([]),
  getCardContent: vi.fn().mockResolvedValue(content),
  recordReview: (...a: unknown[]) => recordReview(...a),
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { deckId: "1" } }),
  RouterLink: { template: "<a><slot/></a>" },
}));

import StudySession from "../StudySession.vue";

const stubs = { SpeakButton: true, FuriganaText: true };

describe("StudySession", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("hiện mặt trước → Hiện đáp án lộ nghĩa → Tốt gọi recordReview", async () => {
    const wrapper = mount(StudySession, { global: { stubs } });
    await new Promise((r) => setTimeout(r, 0)); // chờ build() hàng đợi
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("食べる");
    expect(wrapper.text()).not.toContain("ăn");

    await wrapper.get("button").trigger("click"); // Hiện đáp án
    expect(wrapper.text()).toContain("ăn");

    const good = wrapper.findAll("button").find((b) => b.text().includes("Tốt"));
    await good!.trigger("click");
    expect(recordReview).toHaveBeenCalledOnce();
  });
});
