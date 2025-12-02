import { useCallback, useRef, useState } from "react";
import { useDynamicSheet } from "./useDynamicSheet";
import { randomFishDuration } from "../utils/fish";

export type HorseEntry = { id: number; top: string; duration: number; dir: "ltr" | "rtl" };

export function useHorseSpawner() {
  const [horseList, setHorseList] = useState<HorseEntry[]>([]);
  const idRef = useRef(0);
  const { insertRule, removeRuleContaining } = useDynamicSheet();
  const ruleMap = useRef<Record<number, string>>({});

  const spawnHorse = useCallback((dir: "ltr" | "rtl") => {
    const id = ++idRef.current;
    // keep horses lower on the page
    const top = (Math.floor(Math.random() * (88 - 70 + 1)) + 70) + "%";
    const duration = randomFishDuration();
    setHorseList((prev) => [...prev, { id, top, duration, dir }]);

    try {
      const className = `horse-id-${id}`;
      const rule = `.horse.${className} { top: ${top}; animation-duration: ${duration}s; }`;
      const inserted = insertRule(rule);
      if (inserted) ruleMap.current[id] = inserted;
    } catch {
      // ignore
    }
  }, [insertRule]);

  const removeHorse = useCallback((id: number) => {
    setHorseList((prev) => prev.filter((h) => h.id !== id));
    removeRuleContaining(`horse-id-${id}`);
    delete ruleMap.current[id];
  }, [removeRuleContaining]);

  return { horseList, spawnHorse, removeHorse } as const;
}
