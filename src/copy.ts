import type { Lang } from "../shared/prompt";

export const COPY = {
  id: {
    welcome: "Satu foto ruangannya, dan benda-benda di sana bisa bicara untuknya.",
    pickPhoto: "Ambil / pilih foto ruangan",
    photoNote: "Foto dikirim sekali ke layanan AI untuk mencari benda, lalu hanya disimpan di perangkat ini.",
    looking: "Mencari benda…",
    spotsTitle: "Titik bicara",
    done: "Selesai",
    holdToEdit: "Tahan 2 detik untuk mengatur",
    hear: "Dengar",
    edit: "Ubah",
    remove: "Hapus",
    addSpot: "Tambah titik",
    addHint: "Ketuk foto tepat di bendanya.",
    phrasePlaceholder: "Apa yang ingin ia katakan?",
    save: "Simpan",
    cancel: "Batal",
    maxReached: "Sudah 12 titik — hapus satu untuk menambah.",
    langLocked: "Ganti foto untuk mengganti bahasa.",
  },
  en: {
    welcome: "One photo of his room, and the things in it can speak for him.",
    pickPhoto: "Take / choose a room photo",
    photoNote: "The photo is sent once to an AI service to find objects, then kept only on this device.",
    looking: "Looking for objects…",
    spotsTitle: "Speaking spots",
    done: "Done",
    holdToEdit: "Hold 2 seconds to edit",
    hear: "Hear",
    edit: "Edit",
    remove: "Remove",
    addSpot: "Add spot",
    addHint: "Tap the photo right on the object.",
    phrasePlaceholder: "What would he want to say?",
    save: "Save",
    cancel: "Cancel",
    maxReached: "12 spots already — remove one to add another.",
    langLocked: "Choose a new photo to change the language.",
  },
} satisfies Record<Lang, Record<string, string>>;

export type Copy = (typeof COPY)["id"];

// Always-on core row: short label on the button, what gets spoken.
export const CORE_WORDS: Record<Lang, { label: string; phrase: string }[]> = {
  id: [
    { label: "Ya", phrase: "Ya" },
    { label: "Tidak", phrase: "Tidak" },
    { label: "Tolong", phrase: "Tolong" },
    { label: "Sakit", phrase: "Aku sakit" },
    { label: "Toilet", phrase: "Aku mau ke toilet" },
  ],
  en: [
    { label: "Yes", phrase: "Yes" },
    { label: "No", phrase: "No" },
    { label: "Help", phrase: "Help me" },
    { label: "Pain", phrase: "I'm in pain" },
    { label: "Toilet", phrase: "I need the toilet" },
  ],
};
