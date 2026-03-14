import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "./en";
import { vi } from "./vi";

export type Locale = "en" | "vi";

const dictionaries: Record<Locale, Record<string, string>> = { en, vi };

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "language" }
  )
);

export function useTranslation() {
  const { locale, setLocale } = useLanguageStore();
  const t = (key: string) => dictionaries[locale][key] ?? key;
  return { t, locale, setLocale };
}
