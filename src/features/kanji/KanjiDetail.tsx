import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { getDb } from "../../db/client";
import { getKanjiDetail } from "../../db/kanji.repo";
import { SpeakButton } from "../../shared/tts/SpeakButton";
import { BookmarkButton } from "../../shared/BookmarkButton";
import { NoteEditor } from "../../shared/NoteEditor";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 py-1">
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function KanjiDetail() {
  const { id } = useParams({ from: "/kanji/$id" });
  const kanjiId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ["kanji", kanjiId],
    queryFn: () => getKanjiDetail(getDb(), kanjiId),
  });

  if (isLoading) return <p className="text-slate-500">Đang tải…</p>;
  if (!data)
    return (
      <p>
        Không tìm thấy kanji.{" "}
        <Link to="/kanji" className="text-indigo-600">
          ← Quay lại
        </Link>
      </p>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/kanji" className="text-sm text-indigo-600">
        ← Kanji
      </Link>
      <div className="mt-2 flex items-center gap-4">
        <span className="text-6xl leading-none">{data.literal}</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SpeakButton text={data.literal} />
            <BookmarkButton itemType="kanji" itemId={data.id} />
            {data.jlpt_level && (
              <span className="rounded bg-indigo-100 px-1.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                {data.jlpt_level}
              </span>
            )}
          </div>
          <span className="text-lg">{data.meaning_vi || data.meaning_en}</span>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <Row label="Âm On" value={data.on_readings} />
        <Row label="Âm Kun" value={data.kun_readings} />
        <Row label="Số nét" value={data.stroke_count} />
        <Row label="Bộ thủ" value={data.radical} />
        <Row label="Grade" value={data.grade} />
        {data.meaning_vi && <Row label="Nghĩa (EN)" value={data.meaning_en} />}
      </div>

      {data.words.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold">Từ chứa kanji này</h3>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.words.map((w) => (
              <li key={w.id}>
                <Link
                  to="/word/$id"
                  params={{ id: String(w.id) }}
                  className="flex items-baseline gap-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <span className="text-lg">{w.headword}</span>
                  <span className="text-sm text-slate-500">
                    {w.reading_kana}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NoteEditor itemType="kanji" itemId={data.id} />
    </div>
  );
}
