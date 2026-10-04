import { useRef, useState } from "react";
import type { Lang } from "../shared/prompt";
import { SetupScreen, type SetupStatus } from "./components/SetupScreen";
import { SpeakScreen } from "./components/SpeakScreen";
import { detectSpots } from "./detect-client";
import { preparePhoto } from "./image";
import { boxToSpot, handoffSeen, loadScene, markHandoffSeen, saveScene, separateSpots, type Scene } from "./scene";

export default function App() {
  const [saved] = useState(loadScene);
  const [lang, setLang] = useState<Lang>(saved?.lang ?? "id");
  const [scene, setScene] = useState<Scene | null>(saved);
  const [status, setStatus] = useState<SetupStatus>(saved ? "ready" : "idle");
  const [mode, setMode] = useState<"setup" | "speak">(saved ? "speak" : "setup");
  const [storageFailed, setStorageFailed] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const lastPhoto = useRef<{ base64: string; aspect: number } | null>(null);
  const run = useRef(0);

  async function detect() {
    const photo = lastPhoto.current;
    if (!photo) return;
    const mine = ++run.current;
    setStatus("looking");
    try {
      const found = await detectSpots(photo.base64, lang);
      if (mine !== run.current) return;
      setScene((s) => s && { ...s, spots: separateSpots(found.map((d) => boxToSpot(d.box, d.label, d.phrase, photo.aspect)), photo.aspect) });
      setStatus("ready");
    } catch {
      if (mine === run.current) setStatus("failed");
    }
  }

  async function handlePhoto(file: File) {
    const photo = await preparePhoto(file);
    lastPhoto.current = { base64: photo.base64, aspect: photo.aspect };
    setScene({ version: 1, lang, photo: photo.dataUrl, aspect: photo.aspect, spots: [] });
    await detect();
  }

  function handleDone() {
    if (!scene) return;
    if (!saveScene(scene) && !storageFailed) {
      setStorageFailed(true); // say it once; a second Done continues with the in-memory scene
      return;
    }
    setShowHandoff(!handoffSeen());
    setMode("speak");
  }

  if (mode === "speak" && scene)
    return (
      <SpeakScreen
        scene={scene}
        showHandoff={showHandoff}
        onHandoffSeen={() => {
          markHandoffSeen();
          setShowHandoff(false);
        }}
        onExit={() => setMode("setup")}
      />
    );

  return (
    <SetupScreen
      lang={lang}
      scene={scene}
      status={status}
      storageFailed={storageFailed}
      onLang={setLang}
      onPhoto={handlePhoto}
      onRetry={detect}
      onSpots={(spots) => setScene((s) => s && { ...s, spots })}
      onDone={handleDone}
    />
  );
}
