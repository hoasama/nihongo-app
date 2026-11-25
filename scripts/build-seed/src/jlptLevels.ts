export type JlptLevel = "N5" | "N4" | "N3";

/** Map cấp JLPT → danh sách từ/kanji (từ list cộng đồng). */
export type JlptLists = Record<string, string[]>;

/**
 * Trả cấp JLPT của một mục (từ hoặc kanji) bằng cách tra trong các list.
 * N5 được ưu tiên trước N4 nếu trùng. Trả null nếu không có trong list nào.
 */
export function assignLevel(
  item: string,
  lists: JlptLists,
): JlptLevel | null {
  for (const level of ["N5", "N4"] as JlptLevel[]) {
    if (lists[level]?.includes(item)) return level;
  }
  return null;
}

/** Dựng Set tra nhanh từ JlptLists (dùng cho tập lớn). */
export function buildLevelIndex(lists: JlptLists): Map<string, JlptLevel> {
  const idx = new Map<string, JlptLevel>();
  for (const level of ["N4", "N5"] as JlptLevel[]) {
    // Ghi N4 trước, N5 sau để N5 thắng khi trùng.
    for (const item of lists[level] ?? []) idx.set(item, level);
  }
  return idx;
}
