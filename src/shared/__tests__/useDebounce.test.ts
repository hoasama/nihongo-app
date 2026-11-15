import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref, nextTick } from "vue";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("trì hoãn cập nhật tới khi hết delay", async () => {
    const src = ref("a");
    const d = useDebounce(src, 300);
    expect(d.value).toBe("a");

    src.value = "ab";
    await nextTick();
    expect(d.value).toBe("a");

    vi.advanceTimersByTime(299);
    expect(d.value).toBe("a");
    vi.advanceTimersByTime(1);
    expect(d.value).toBe("ab");
  });
});
