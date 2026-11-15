import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { listByLevel, searchKanji } from "../../db/kanji.repo";
import { useDebounce } from "../../shared/useDebounce";

const LEVELS = ["N5", "N4"] as const;

export function KanjiPage() {
  const [level, setLevel] = useState<string>("N5");
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 250);
  const searching = q.length > 0;

  const { data } = useQuery({
    queryKey: searching ? ["kanjiSearch", q] : ["kanjiLevel", level],
    queryFn: () =>
      searching ? searchKanji(getDb(), q) : listByLevel(getDb(), level),
  });

  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">Kanji</h2>

      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded border border-slate-300 dark:border-slate-700">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-sm ${
                !searching && level === l
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kanji hoặc nghĩa (vd: 日, water)…"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {data?.length === 0 && (
        <p className="text-slate-500">Không có kanji phù hợp.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {data?.map((k) => (
          <Link
            key={k.id}
            to="/kanji/$id"
            params={{ id: String(k.id) }}
            className="flex flex-col items-center rounded border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <span className="text-3xl">{k.literal}</span>
            <span className="mt-1 line-clamp-1 text-center text-xs text-slate-500">
              {k.meaning_en}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
