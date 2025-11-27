import { useCallback, useRef, useState } from "react";
import { useDynamicSheet } from "./useDynamicSheet";
import { randomFishTop, randomFishDuration } from "../utils/fish";

export type FishEntry = { id: number; top: string; duration: number; dir: "ltr" | "rtl" };

export function useFishSpawner() {
  const [fishList, setFishList] = useState<FishEntry[]>([]);
  const idRef = useRef(0);
  const { insertRule, removeRuleContaining } = useDynamicSheet();
  const ruleMap = useRef<Record<number, string>>({});

  const spawnFish = useCallback((dir: "ltr" | "rtl") => {
    const id = ++idRef.current;
    const top = randomFishTop();
    const duration = randomFishDuration();
    setFishList((prev) => [...prev, { id, top, duration, dir }]);

    // insert per-fish class rule
    try {
      const className = `fish-id-${id}`;
      const rule = `.fish.${className} { top: ${top}; animation-duration: ${duration}s; }`;
      const inserted = insertRule(rule);
      if (inserted) ruleMap.current[id] = inserted;
    } catch {
      // ignore
    }
  }, [insertRule]);

  const removeFish = useCallback((id: number) => {
    setFishList((prev) => prev.filter((f) => f.id !== id));
    removeRuleContaining(`fish-id-${id}`);
    delete ruleMap.current[id];
  }, [removeRuleContaining]);

  return { fishList, spawnFish, removeFish } as const;
}
