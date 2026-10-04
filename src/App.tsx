import { useState } from "react";
import type { Lang } from "../shared/prompt";
import { SetupScreen, type SetupStatus } from "./components/SetupScreen";
import { detectSpots } from "./detect-client";
import { preparePhoto } from "./image";
import { boxToSpot, type Scene } from "./scene";

export default function App() {
  const [lang, setLang] = useState<Lang>("id");
  const [scene, setScene] = useState<Scene | null>(null);
  const [status, setStatus] = useState<SetupStatus>("idle");

  async function handlePhoto(file: File) {
    const photo = await preparePhoto(file);
    setScene({ version: 1, lang, photo: photo.dataUrl, aspect: photo.aspect, spots: [] });
    setStatus("looking");
    const found = await detectSpots(photo.base64, lang).catch(() => []); // failure states arrive in slice 4
    setScene((s) => s && { ...s, spots: found.map((d) => boxToSpot(d.box, d.label, d.phrase, photo.aspect)) });
    setStatus("ready");
  }

  return (
    <SetupScreen
      lang={lang}
      scene={scene}
      status={status}
      onLang={setLang}
      onPhoto={handlePhoto}
      onDone={() => {}}
    />
  );
}
