import { useCallback, useState } from "react";
import { api } from "@/src/api";
import { LANGUAGES } from "@/src/theme";

export type TranslationMap = Record<number, { text: string; lang: string }>;

export function useTranslate(defaultLang?: string) {
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const openPicker = useCallback((idx: number) => {
    setError(null);
    setErrorCode(null);
    setPickerOpenFor(idx);
  }, []);

  const closePicker = useCallback(() => setPickerOpenFor(null), []);

  const clearTranslation = useCallback((idx: number) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setTranslations({}), []);

  const labelFor = useCallback((idx: number): string | undefined => {
    const t = translations[idx];
    if (!t) return undefined;
    const lang = LANGUAGES.find((l) => l.code === t.lang);
    return lang ? `${lang.flag} ${lang.name}` : t.lang;
  }, [translations]);

  const translate = useCallback(
    async (idx: number, text: string, target: string, sourceLang?: string) => {
      setTranslatingIdx(idx);
      setError(null);
      setErrorCode(null);
      try {
        const res = await api.translate({
          texts: [text],
          target_language: target,
          source_language: sourceLang || defaultLang,
        });
        const out = res.translations?.[0] || "";
        if (out) {
          setTranslations((prev) => ({
            ...prev,
            [idx]: { text: out, lang: target },
          }));
        }
      } catch (e: any) {
        setError(e?.message ?? "Translation failed");
        setErrorCode(e?.code ?? null);
      } finally {
        setTranslatingIdx(null);
      }
    },
    [defaultLang],
  );

  return {
    translations,
    translatingIdx,
    pickerOpenFor,
    error,
    errorCode,
    openPicker,
    closePicker,
    clearTranslation,
    clearAll,
    labelFor,
    translate,
    setError,
    setErrorCode,
  };
}
