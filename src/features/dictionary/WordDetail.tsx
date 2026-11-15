import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { getWordDetail } from "../../db/words.repo";
import { SpeakButton } from "../../shared/tts/SpeakButton";
import { BookmarkButton } from "../../shared/BookmarkButton";
import { NoteEditor } from "../../shared/NoteEditor";

export function WordDetail() {
  const { id } = useParams({ from: "/word/$id" });
  const wordId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ["word", wordId],
    queryFn: () => getWordDetail(getDb(), wordId),
  });

  if (isLoading) return <p className="text-slate-500">Đang tải…</p>;
  if (!data)
    return (
      <p>
        Không tìm thấy từ.{" "}
        <Link to="/" className="text-indigo-600">
          ← Quay lại
        </Link>
      </p>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-indigo-600">
        ← Tra từ
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h2 className="text-3xl font-bold">{data.headword}</h2>
        <SpeakButton text={data.headword} />
        <BookmarkButton itemType="word" itemId={data.id} />
      </div>
      <p className="text-slate-500">
        {data.reading_kana}
        {data.reading_romaji ? ` · ${data.reading_romaji}` : ""}
      </p>
      {data.jlpt_level && (
        <span className="mt-1 inline-block rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
          {data.jlpt_level}
        </span>
      )}

      <ol className="mt-4 list-decimal space-y-1 pl-5">
        {data.senses.map((s, i) => (
          <li key={i}>
            {s.part_of_speech && (
              <span className="mr-2 text-xs uppercase text-slate-400">
                {s.part_of_speech}
              </span>
            )}
            <span>{s.gloss_vi || s.gloss_en}</span>
            {s.gloss_vi && s.gloss_en && (
              <span className="ml-2 text-slate-400">({s.gloss_en})</span>
            )}
          </li>
        ))}
      </ol>

      {data.sentences.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold">Câu ví dụ</h3>
          <ul className="space-y-2">
            {data.sentences.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <SpeakButton text={s.jp_text} />
                <div>
                  <p>{s.jp_text}</p>
                  {s.translation_en && (
                    <p className="text-sm text-slate-500">{s.translation_en}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NoteEditor itemType="word" itemId={data.id} />
    </div>
  );
}
