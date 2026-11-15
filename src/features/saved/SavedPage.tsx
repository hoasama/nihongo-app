import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { listBookmarksDetailed } from "../../db/user.repo";
import type { ItemType } from "../../shared/types";

const GROUPS: { type: ItemType; title: string; to: string }[] = [
  { type: "word", title: "Từ vựng", to: "/word/$id" },
  { type: "kanji", title: "Kanji", to: "/kanji/$id" },
  { type: "grammar", title: "Ngữ pháp", to: "/grammar/$id" },
];

export function SavedPage() {
  const { data } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => listBookmarksDetailed(getDb()),
  });

  const isEmpty = data && data.length === 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold">Đã lưu</h2>
      {isEmpty && (
        <p className="text-slate-500">
          Chưa có mục nào. Bấm ★ ở trang từ/kanji/ngữ pháp để lưu.
        </p>
      )}
      {GROUPS.map((g) => {
        const items = data?.filter((b) => b.item_type === g.type) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={g.type} className="mb-5">
            <h3 className="mb-1 font-semibold text-slate-600 dark:text-slate-300">
              {g.title}
            </h3>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((b) => (
                <li key={b.id}>
                  <Link
                    to={g.to}
                    params={{ id: String(b.item_id) }}
                    className="block py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    {b.label ?? `#${b.item_id}`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
