// @vitest-environment node
import { describe, it, expect } from "vitest";
import { schedule, type CardState } from "../scheduler";

const fresh: CardState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
const NOW = new Date("2026-11-17T00:00:00.000Z");

describe("schedule (SM-2)", () => {
  it("again: reset repetitions, lapses+1, hẹn ~10 phút, ease giảm", () => {
    const r = schedule({ ...fresh, repetitions: 3, easeFactor: 2.5 }, "again", NOW);
    expect(r.state.repetitions).toBe(0);
    expect(r.state.lapses).toBe(1);
    expect(r.state.intervalDays).toBe(0);
    expect(r.state.easeFactor).toBeCloseTo(2.3, 5);
    expect(r.due.getTime()).toBe(NOW.getTime() + 10 * 60 * 1000);
  });

  it("good lần đầu (reps 0) → interval 1 ngày, reps 1, ease giữ 2.5", () => {
    const r = schedule(fresh, "good", NOW);
    expect(r.state.intervalDays).toBe(1);
    expect(r.state.repetitions).toBe(1);
    expect(r.state.easeFactor).toBeCloseTo(2.5, 5);
    expect(r.due.getTime()).toBe(NOW.getTime() + 1 * 86400000);
  });

  it("good lần 2 (reps 1) → interval 6 ngày", () => {
    const r = schedule({ ...fresh, repetitions: 1, intervalDays: 1 }, "good", NOW);
    expect(r.state.intervalDays).toBe(6);
    expect(r.state.repetitions).toBe(2);
  });

  it("good lần 3 (reps 2, interval 6, EF 2.5) → round(6*2.5)=15", () => {
    const r = schedule({ easeFactor: 2.5, intervalDays: 6, repetitions: 2, lapses: 0 }, "good", NOW);
    expect(r.state.intervalDays).toBe(15);
  });

  it("easy > good > hard về interval kế (reps 2, interval 10)", () => {
    const base: CardState = { easeFactor: 2.5, intervalDays: 10, repetitions: 2, lapses: 0 };
    const hard = schedule(base, "hard", NOW).state.intervalDays;
    const good = schedule(base, "good", NOW).state.intervalDays;
    const easy = schedule(base, "easy", NOW).state.intervalDays;
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("ease không xuống dưới 1.3 dù again nhiều lần", () => {
    let s: CardState = { easeFactor: 1.4, intervalDays: 0, repetitions: 0, lapses: 0 };
    for (let i = 0; i < 5; i++) s = schedule(s, "again", NOW).state;
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
