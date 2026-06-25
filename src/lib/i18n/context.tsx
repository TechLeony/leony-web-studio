import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANGS, TRANSLATIONS, type Dict, type Lang } from "./translations";

const STORAGE_KEY = "leony.lang";
const COOKIE_KEY = "leony_lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
};

const LanguageContext = createContext<Ctx | null>(null);

function readStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (LANGS as string[]).includes(v)) return v as Lang;
  } catch {
    // ignore
  }
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`));
  if (m && (LANGS as string[]).includes(m[1])) return m[1] as Lang;
  return null;
}

function detectFromBrowser(): Lang {
  if (typeof navigator === "undefined") return "en";
  const langs = (navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  ).map((l) => l.toLowerCase());
  // Use timezone as a country hint (proxy for geo).
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    tz = "";
  }
  if (tz === "Europe/Istanbul") return "tr";
  if (tz === "Asia/Baku") return "az";
  for (const l of langs) {
    if (l.startsWith("tr")) return "tr";
    if (l.startsWith("az")) return "az";
  }
  return "en";
}

async function detectFromIP(): Promise<Lang | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("https://ipapi.co/country/", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const code = (await res.text()).trim().toUpperCase();
    if (code === "TR") return "tr";
    if (code === "AZ") return "az";
    return "en";
  } catch {
    return null;
  }
}

function persist(lang: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_KEY}=${lang}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with TR (matches existing SSR copy). Hydration corrects per saved/detected lang.
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    const stored = readStoredLang();
    if (stored) {
      setLangState(stored);
      return;
    }
    // First-visit detection: try geo, fall back to browser hints.
    let cancelled = false;
    const initial = detectFromBrowser();
    setLangState(initial);
    detectFromIP().then((geo) => {
      if (cancelled || !geo) return;
      // Don't override if user has since picked manually.
      if (readStoredLang()) return;
      setLangState(geo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    persist(l);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: TRANSLATIONS[lang] }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // SSR / outside provider fallback — return TR dict
    return { lang: "tr", setLang: () => {}, t: TRANSLATIONS.tr };
  }
  return ctx;
}

export function useT(): Dict {
  return useLanguage().t;
}
