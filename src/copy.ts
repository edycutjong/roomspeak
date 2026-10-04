import type { Lang } from "../shared/prompt";

export const COPY = {
  id: {
    welcome: "Satu foto ruangannya, dan benda-benda di sana bisa bicara untuknya.",
    pickPhoto: "Ambil / pilih foto ruangan",
    photoNote: "Foto dikirim sekali ke layanan AI untuk mencari benda, lalu hanya disimpan di perangkat ini.",
    looking: "Mencari benda…",
    spotsTitle: "Titik bicara",
    done: "Selesai",
  },
  en: {
    welcome: "One photo of his room, and the things in it can speak for him.",
    pickPhoto: "Take / choose a room photo",
    photoNote: "The photo is sent once to an AI service to find objects, then kept only on this device.",
    looking: "Looking for objects…",
    spotsTitle: "Speaking spots",
    done: "Done",
  },
} satisfies Record<Lang, Record<string, string>>;

export type Copy = (typeof COPY)["id"];
