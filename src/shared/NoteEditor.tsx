import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "../db/client";
import { getNote, saveNote } from "../db/user.repo";
import { useDebounce } from "./useDebounce";
import type { ItemType } from "./types";

export function NoteEditor({
  itemType,
  itemId,
}: {
  itemType: ItemType;
  itemId: number;
}) {
  const { data } = useQuery({
    queryKey: ["note", itemType, itemId],
    queryFn: () => getNote(getDb(), itemType, itemId),
  });

  const [text, setText] = useState("");
  useEffect(() => {
    setText(data ?? "");
  }, [data]);

  const debounced = useDebounce(text, 600);
  useEffect(() => {
    if (debounced !== (data ?? "")) {
      void saveNote(getDb(), itemType, itemId, debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="mt-6">
      <h3 className="mb-1 font-semibold">Ghi chú</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Ghi chú cá nhân… (tự lưu)"
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
