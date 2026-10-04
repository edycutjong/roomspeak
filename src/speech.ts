import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "../shared/prompt";

const BCP47: Record<Lang, string> = { id: "id-ID", en: "en-US" };
const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const voices = synth?.getVoices() ?? [];
  const prefix = lang === "id" ? /^(id|in)[-_]/i : /^en[-_]/i;
  return voices.find((v) => v.lang.toLowerCase() === BCP47[lang].toLowerCase()) ?? voices.find((v) => prefix.test(v.lang));
}

// Speaks phrases with the device voice. A new phrase always interrupts the current one.
// activeKey names what is speaking right now, so the UI can pulse that ring.
export function useSpeaker(lang: Lang) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(() => !!pickVoice(lang));
  const token = useRef(0);

  useEffect(() => {
    const update = () => setHasVoice(!!pickVoice(lang));
    update();
    synth?.addEventListener("voiceschanged", update);
    return () => synth?.removeEventListener("voiceschanged", update);
  }, [lang]);

  const speak = useCallback(
    (key: string, text: string) => {
      const mine = ++token.current;
      setActiveKey(key);
      const finish = () => {
        if (token.current === mine) setActiveKey(null);
      };
      if (!synth) {
        setTimeout(finish, 1800);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = BCP47[lang];
      const voice = pickVoice(lang);
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    },
    [lang],
  );

  return { speak, activeKey, hasVoice: hasVoice && !!synth };
}
