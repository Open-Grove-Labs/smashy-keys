import { useEffect, useState } from "react";

const STORAGE_INCLUDE_NAMES = "includeNames";
const STORAGE_SHOW_NEXT_LETTERS = "showNextLetters";

function readBool(key: string, fallback: boolean) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function useSettings() {
  const [includeNames, setIncludeNames] = useState<boolean>(() => readBool(STORAGE_INCLUDE_NAMES, false));
  const [showNextLetters, setShowNextLetters] = useState<boolean>(() => readBool(STORAGE_SHOW_NEXT_LETTERS, true));

  useEffect(() => {
    localStorage.setItem(STORAGE_INCLUDE_NAMES, JSON.stringify(includeNames));
  }, [includeNames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHOW_NEXT_LETTERS, JSON.stringify(showNextLetters));
  }, [showNextLetters]);

  return {
    includeNames,
    showNextLetters,
    setIncludeNames,
    setShowNextLetters,
  } as const;
}
