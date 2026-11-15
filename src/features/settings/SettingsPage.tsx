import { useEffect, useState } from "react";
import { useSettings } from "../../shared/settingsStore";
import { useSpeak } from "../../shared/tts/useSpeak";

const FONT_OPTIONS = [
  { label: "Nhỏ", value: 1 },
  { label: "Vừa", value: 1.1 },
  { label: "Lớn", value: 1.25 },
];

export function SettingsPage() {
  const { theme, fontScale, ttsRate, ttsVoiceURI, update } = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { speak, supported } = useSpeak({ rate: ttsRate, voiceURI: ttsVoiceURI || undefined });

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () =>
      setVoices(
        synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ja")),
      );
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-xl font-semibold">Cài đặt</h2>

      <section className="mb-6">
        <h3 className="mb-2 font-semibold">Giao diện</h3>
        <div className="flex items-center gap-3">
          <span className="w-28 text-slate-500">Chủ đề</span>
          <div className="flex rounded border border-slate-300 dark:border-slate-700">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update({ theme: t })}
                className={`px-3 py-1.5 text-sm ${
                  theme === t
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {t === "light" ? "Sáng" : "Tối"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="w-28 text-slate-500">Cỡ chữ</span>
          <div className="flex rounded border border-slate-300 dark:border-slate-700">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => update({ fontScale: f.value })}
                className={`px-3 py-1.5 text-sm ${
                  fontScale === f.value
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Phát âm (TTS)</h3>
        {!supported && (
          <p className="mb-2 text-sm text-amber-600">
            Máy chưa có giọng tiếng Nhật. Cài trong Windows: Settings → Time &
            language → Speech → thêm giọng tiếng Nhật.
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="w-28 text-slate-500">Giọng đọc</span>
          <select
            value={ttsVoiceURI}
            onChange={(e) => update({ ttsVoiceURI: e.target.value })}
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Mặc định (ja-JP)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="w-28 text-slate-500">Tốc độ</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={ttsRate}
            onChange={(e) => update({ ttsRate: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="w-10 text-right text-sm">{ttsRate.toFixed(1)}x</span>
        </div>
        <button
          type="button"
          onClick={() => speak("こんにちは、日本語を勉強しましょう。")}
          className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          🔊 Nghe thử
        </button>
      </section>
    </div>
  );
}
