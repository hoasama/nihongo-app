import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { getGrammarDetail } from "../../db/grammar.repo";
import { SpeakButton } from "../../shared/tts/SpeakButton";
import { BookmarkButton } from "../../shared/BookmarkButton";
import { NoteEditor } from "../../shared/NoteEditor";

export function GrammarDetail() {
  const { id } = useParams({ from: "/grammar/$id" });
  const gId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ["grammarDetail", gId],
    queryFn: () => getGrammarDetail(getDb(), gId),
  });

  if (isLoading) return <p className="text-slate-500">Đang tải…</p>;
  if (!data)
    return (
      <p>
        Không tìm thấy mẫu ngữ pháp.{" "}
        <Link to="/grammar" className="text-indigo-600">
          ← Quay lại
        </Link>
      </p>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/grammar" className="text-sm text-indigo-600">
        ← Ngữ pháp
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h2 className="text-2xl font-bold">{data.title}</h2>
        <BookmarkButton itemType="grammar" itemId={data.id} />
        <span className="rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
          {data.jlpt_level}
        </span>
      </div>

      {data.structure && (
        <p className="mt-2 rounded bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">
          {data.structure}
        </p>
      )}
      {data.meaning_vi && <p className="mt-3 font-medium">{data.meaning_vi}</p>}
      {data.explanation_vi && (
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {data.explanation_vi}
        </p>
      )}

      {data.examples.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 font-semibold">Ví dụ</h3>
          <ul className="space-y-2">
            {data.examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-2">
                <SpeakButton text={ex.jp} />
                <div>
                  <p>{ex.jp}</p>
                  <p className="text-sm text-slate-500">{ex.vi}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NoteEditor itemType="grammar" itemId={data.id} />
    </div>
  );
}
