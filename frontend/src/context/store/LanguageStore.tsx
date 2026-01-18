import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "@/context/locales/en";
import { es } from "@/context/locales/es";

type LanguageCode = "en" | "es";
type TranslationParams = Record<string, string | number>;

interface LanguageState {
  language: LanguageCode;
  t: (key: string, params?: TranslationParams) => string;
  setLanguage: (lang: LanguageCode) => void;
}

const dictionaries = { en, es };

const getTranslatedText = (
  lang: LanguageCode,
  key: string,
  params?: TranslationParams
) => {
  const dictionary = dictionaries[lang];
  let text = resolvePath(dictionary, key, key);

  if (typeof text !== "string") return key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(`{{${paramKey}}}`, String(paramValue));
    });
  }
  return text;
};

const resolvePath = (
  object: Record<string, unknown>,
  path: string,
  defaultValue: string
): string => {
  const result = path
    .split(".")
    .reduce<unknown>((acc, part) => section(acc, part), object);
  return typeof result === "string" ? result : defaultValue;
};

function section(acc: unknown, part: string): unknown {
  if (typeof acc === "object" && acc !== null) {
    return (acc as Record<string, unknown>)[part];
  }
  return null;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "es",
      t: (key, params) => getTranslatedText("es", key, params),

      setLanguage: (lang) => {
        set({
          language: lang,
          t: (key, params) => getTranslatedText(lang, key, params),
        });
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = (key, params) =>
            getTranslatedText(state.language, key, params);
        }
      },
    }
  )
);