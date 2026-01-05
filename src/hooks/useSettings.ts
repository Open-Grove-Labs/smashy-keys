import { useEffect, useState } from "react";

const STORAGE_INCLUDE_NAMES = "includeNames";

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

  useEffect(() => {
    localStorage.setItem(STORAGE_INCLUDE_NAMES, JSON.stringify(includeNames));
  }, [includeNames]);

  return {
    includeNames,
    setIncludeNames,
  } as const;
}
