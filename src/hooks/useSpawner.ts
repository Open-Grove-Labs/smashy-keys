import { useCallback, useRef, useState } from "react";
import { useDynamicSheet } from "./useDynamicSheet";

export type SpawnEntry = { id: number; top: string; duration: number; dir: "ltr" | "rtl" };

export function useSpawner(
  baseClass: string,
  topFn: () => string,
  durationFn: () => number
) {
  const [list, setList] = useState<SpawnEntry[]>([]);
  const idRef = useRef(0);
  const { insertRule, removeRuleContaining } = useDynamicSheet();
  const ruleMap = useRef<Record<number, string>>({});

  const spawn = useCallback((dir: "ltr" | "rtl") => {
    const id = ++idRef.current;
    const top = topFn();
    const duration = durationFn();
    setList((prev) => [...prev, { id, top, duration, dir }]);

    try {
      const className = `${baseClass}-id-${id}`;
      const rule = `.${baseClass}.${className} { top: ${top}; animation-duration: ${duration}s; }`;
      const inserted = insertRule(rule);
      if (inserted) ruleMap.current[id] = inserted;
    } catch {
      // ignore
    }
  }, [baseClass, insertRule, topFn, durationFn]);

  const remove = useCallback((id: number) => {
    setList((prev) => prev.filter((x) => x.id !== id));
    removeRuleContaining(`${baseClass}-id-${id}`);
    delete ruleMap.current[id];
  }, [baseClass, removeRuleContaining]);

  return { list, spawn, remove } as const;
}
