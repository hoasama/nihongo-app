import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../db/client";
import { addBookmark, isBookmarked, removeBookmark } from "../db/user.repo";
import type { ItemType } from "./types";

export function BookmarkButton({
  itemType,
  itemId,
}: {
  itemType: ItemType;
  itemId: number;
}) {
  const qc = useQueryClient();
  const key = ["bookmarked", itemType, itemId];
  const { data: marked } = useQuery({
    queryKey: key,
    queryFn: () => isBookmarked(getDb(), itemType, itemId),
  });

  const toggle = async () => {
    if (marked) await removeBookmark(getDb(), itemType, itemId);
    else await addBookmark(getDb(), itemType, itemId);
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={marked ? "Bỏ lưu" : "Lưu"}
      className="text-xl text-amber-500 hover:scale-110"
    >
      {marked ? "★" : "☆"}
    </button>
  );
}
