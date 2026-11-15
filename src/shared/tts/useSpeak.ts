import { onMounted, onUnmounted, ref } from "vue";

/**
 * Phát âm tiếng Nhật qua Web Speech API (giọng ja-JP của hệ điều hành).
 * `supported=false` khi máy không có giọng tiếng Nhật.
 */
export function useSpeak() {
  const supported = ref(false);
  let synth: SpeechSynthesis | undefined;

  const check = () => {
    if (synth)
      supported.value = synth
        .getVoices()
        .some((v) => v.lang?.toLowerCase().startsWith("ja"));
  };

  onMounted(() => {
    synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return;
    check();
    synth.addEventListener?.("voiceschanged", check);
  });
  onUnmounted(() => synth?.removeEventListener?.("voiceschanged", check));

  function speak(
    text: string,
    opts: { rate?: number; voiceURI?: string } = {},
  ) {
    const s = window.speechSynthesis;
    if (!s || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if (opts.rate) u.rate = opts.rate;
    const voices = s.getVoices();
    const voice = opts.voiceURI
      ? voices.find((v) => v.voiceURI === opts.voiceURI)
      : voices.find((v) => v.lang?.toLowerCase().startsWith("ja"));
    if (voice) u.voice = voice;
    s.cancel();
    s.speak(u);
  }

  return { speak, supported };
}
