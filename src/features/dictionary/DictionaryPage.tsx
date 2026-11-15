import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { searchWords } from "../../db/words.repo";
import { useDebounce } from "../../shared/useDebounce";

const inputCls =
  "rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900";

export function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const q = useDebounce(query.trim(), 250);

  const { data, isFetching } = useQuery({
    queryKey: ["words", q, level],
    queryFn: () => searchWords(getDb(), q, level || undefined),
    enabled: q.length > 0,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold">Tra từ điển</h2>
      <div className="mb-4 flex gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập kanji, kana, romaji hoặc nghĩa…"
          className={`flex-1 ${inputCls}`}
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={inputCls}
        >
          <option value="">Mọi cấp</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
        </select>
      </div>

      {q.length === 0 && (
        <p className="text-slate-500">Nhập để bắt đầu tra từ.</p>
      )}
      {q.length > 0 && !isFetching && data?.length === 0 && (
        <p className="text-slate-500">Không tìm thấy từ nào.</p>
      )}

      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {data?.map((w) => (
          <li key={w.id}>
            <Link
              to="/word/$id"
              params={{ id: String(w.id) }}
              className="flex items-baseline gap-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span className="text-lg">{w.headword}</span>
              <span className="text-sm text-slate-500">{w.reading_kana}</span>
              {w.jlpt_level && (
                <span className="ml-auto rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  {w.jlpt_level}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
