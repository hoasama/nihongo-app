import { useCallback, useEffect, useState } from "react";

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string;
}

/**
 * Phát âm tiếng Nhật qua Web Speech API (giọng ja-JP của hệ điều hành).
 * `supported=false` khi máy không có giọng tiếng Nhật → UI hiện hướng dẫn cài.
 */
export function useSpeak(opts: SpeakOptions = {}) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) {
      setSupported(false);
      return;
    }
    const check = () =>
      setSupported(
        synth.getVoices().some((v) => v.lang?.toLowerCase().startsWith("ja")),
      );
    check();
    synth.addEventListener?.("voiceschanged", check);
    return () => synth.removeEventListener?.("voiceschanged", check);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      if (opts.rate) u.rate = opts.rate;
      const voices = synth.getVoices();
      const voice = opts.voiceURI
        ? voices.find((v) => v.voiceURI === opts.voiceURI)
        : voices.find((v) => v.lang?.toLowerCase().startsWith("ja"));
      if (voice) u.voice = voice;
      synth.cancel();
      synth.speak(u);
    },
    [opts.rate, opts.voiceURI],
  );

  return { speak, supported };
}
