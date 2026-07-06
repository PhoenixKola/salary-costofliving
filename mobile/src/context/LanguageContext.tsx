import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language } from "../types";
import { copy, type Copy } from "../lib/i18n";

const LANG_KEY = "salary_costofliving_lang_v1";

type LanguageState = {
  lang: Language;
  setLang: (l: Language) => void;
  t: Copy;
};

const LanguageContext = React.createContext<LanguageState>({
  lang: "en",
  setLang: () => {},
  t: copy.en
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>("sq");

  React.useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === "en" || saved === "sq") setLangState(saved);
    });
  }, []);

  const setLang = React.useCallback((l: Language) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l);
  }, []);

  const value = React.useMemo(() => ({ lang, setLang, t: copy[lang] }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
