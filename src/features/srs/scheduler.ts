export type Rating = "again" | "hard" | "good" | "easy";

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface ScheduleResult {
  state: CardState;
  due: Date;
}

const MIN_EF = 1.3;
const AGAIN_MS = 10 * 60 * 1000; // 10 phút
const DAY_MS = 24 * 60 * 60 * 1000;
const Q: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

/** SM-2 thuần. Không đụng DB/Vue — toàn bộ "bộ não" xếp lịch nằm ở đây. */
export function schedule(state: CardState, rating: Rating, now: Date): ScheduleResult {
  if (rating === "again") {
    return {
      state: {
        easeFactor: Math.max(MIN_EF, state.easeFactor - 0.2),
        intervalDays: 0,
        repetitions: 0,
        lapses: state.lapses + 1,
      },
      due: new Date(now.getTime() + AGAIN_MS),
    };
  }

  // đúng (hard/good/easy)
  let intervalDays: number;
  if (state.repetitions === 0) intervalDays = 1;
  else if (state.repetitions === 1) intervalDays = 6;
  else {
    const factor =
      rating === "hard" ? 1.2 : rating === "easy" ? state.easeFactor * 1.3 : state.easeFactor;
    intervalDays = Math.round(state.intervalDays * factor);
  }

  const q = Q[rating];
  const easeFactor = Math.max(
    MIN_EF,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    state: { easeFactor, intervalDays, repetitions: state.repetitions + 1, lapses: state.lapses },
    due: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}
