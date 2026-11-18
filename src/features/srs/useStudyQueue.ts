import { computed, ref } from "vue";
import { getDb } from "../../db/client";
import { useSettings } from "../../shared/settingsStore";
import {
  getDueCards,
  getCardContent,
  introduceNewCards,
  getDeckCounts,
  recordReview,
} from "../../db/srs.repo";
import type { Card, CardContent, Rating } from "../../shared/types";

export interface QueueItem {
  card: Card;
  content: CardContent;
}

export function useStudyQueue(deckId: number) {
  const queue = ref<QueueItem[]>([]);
  const index = ref(0);
  const revealed = ref(false);
  const loading = ref(true);
  const settings = useSettings();

  const current = computed<QueueItem | undefined>(() => queue.value[index.value]);
  const done = computed(() => !loading.value && index.value >= queue.value.length);
  const remaining = computed(() => Math.max(0, queue.value.length - index.value));

  async function build() {
    const db = getDb();
    const counts = await getDeckCounts(db, deckId, settings.srsNewPerDay);
    const due = await getDueCards(db, deckId, 200);
    const fresh = await introduceNewCards(db, deckId, counts.newRemaining);
    const cards = [...due, ...fresh];
    queue.value = await Promise.all(
      cards.map(async (card) => ({ card, content: await getCardContent(db, card) })),
    );
    index.value = 0;
    revealed.value = false;
    loading.value = false;
  }

  function reveal() {
    revealed.value = true;
  }

  async function grade(rating: Rating) {
    const item = current.value;
    if (!item) return;
    await recordReview(getDb(), item.card, rating);
    if (rating === "again") queue.value.push(item); // xem lại cuối phiên
    index.value += 1;
    revealed.value = false;
  }

  void build();

  return { current, done, loading, remaining, revealed, reveal, grade };
}
