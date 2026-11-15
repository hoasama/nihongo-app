import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { listGrammar } from "../../db/grammar.repo";

const LEVELS = ["N5", "N4"] as const;

export function GrammarPage() {
  const [level, setLevel] = useState<string>("N5");
  const [query, setQuery] = useState("");
  const { data } = useQuery({
    queryKey: ["grammar", level],
    queryFn: () => listGrammar(getDb(), level),
  });

  const kw = query.trim().toLowerCase();
  const items = kw
    ? data?.filter((g) => g.title.toLowerCase().includes(kw))
    : data;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold">Ngữ pháp</h2>

      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded border border-slate-300 dark:border-slate-700">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-sm ${
                level === l
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
          placeholder="Tìm mẫu ngữ pháp…"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {items?.length === 0 && (
        <p className="text-slate-500">
          Chưa có mẫu ngữ pháp {level}
          {kw ? " khớp từ khoá" : ""}.
        </p>
      )}

      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {items?.map((g) => (
          <li key={g.id}>
            <Link
              to="/grammar/$id"
              params={{ id: String(g.id) }}
              className="block py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span className="text-lg">{g.title}</span>
              {g.structure && (
                <span className="ml-2 text-sm text-slate-500">
                  {g.structure}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
