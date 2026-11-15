import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { useSpeak } from "../useSpeak";

class FakeUtterance {
  lang = "";
  rate = 1;
  voice: unknown = null;
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

function mockSynth(voices: { lang: string; voiceURI: string }[]) {
  const spoken: FakeUtterance[] = [];
  (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    FakeUtterance;
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    getVoices: () => voices,
    speak: (u: FakeUtterance) => spoken.push(u),
    cancel: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return spoken;
}

function mountSpeak() {
  let api!: ReturnType<typeof useSpeak>;
  const Comp = defineComponent({
    setup() {
      api = useSpeak();
      return () => null;
    },
  });
  mount(Comp);
  return api;
}

describe("useSpeak", () => {
  it("supported=true khi có giọng tiếng Nhật", () => {
    mockSynth([{ lang: "ja-JP", voiceURI: "ja1" }]);
    const api = mountSpeak();
    expect(api.supported.value).toBe(true);
  });

  it("speak tạo utterance lang ja-JP với nội dung đúng", () => {
    const spoken = mockSynth([{ lang: "ja-JP", voiceURI: "ja1" }]);
    const api = mountSpeak();
    api.speak("こんにちは");
    expect(spoken[0].lang).toBe("ja-JP");
    expect(spoken[0].text).toBe("こんにちは");
  });

  it("supported=false khi không có giọng tiếng Nhật", () => {
    mockSynth([{ lang: "en-US", voiceURI: "en1" }]);
    const api = mountSpeak();
    expect(api.supported.value).toBe(false);
  });
});
