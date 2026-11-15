import { useSpeak } from "./useSpeak";

export function SpeakButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { speak, supported } = useSpeak();
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      title={
        supported
          ? "Phát âm"
          : "Máy chưa có giọng tiếng Nhật — cài gói giọng ja-JP trong Windows (Settings → Time & language → Speech)"
      }
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-base hover:bg-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      🔊
    </button>
  );
}
