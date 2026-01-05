import { useCallback, useRef, useState } from "react";
import { useDynamicSheet } from "./useDynamicSheet";
import { getCharColor } from "../utils/colors";

export function useCharClass() {
  const { insertRule } = useDynamicSheet();
  const ruleMap = useRef<Record<string, string>>({});
  const [className, setClassName] = useState("");

  const ensureCharClass = useCallback((char: string, customColor?: string) => {
    // For multi-character strings with custom color, use a special class
    if (customColor) {
      const colorKey = `custom-${customColor.replace('#', '')}`;
      const name = `char-${colorKey}`;
      if (!ruleMap.current[name]) {
        try {
          const rule = `.${name} { --char-color: ${customColor}; }`;
          const inserted = insertRule(rule);
          if (inserted) ruleMap.current[name] = inserted;
        } catch {
          // ignore
        }
      }
      setClassName(name);
      return;
    }
    
    // For single characters without custom color, use character-based class
    if (!/^[a-zA-Z0-9]$/.test(char)) {
      setClassName("");
      return;
    }
    const safe = char.replace(/[^a-zA-Z0-9]/g, (c) => `_${c.charCodeAt(0)}`);
    const name = `char-${safe}`;
    if (!ruleMap.current[name]) {
      try {
        const color = getCharColor(char);
        const rule = `.${name} { --char-color: ${color}; }`;
        const inserted = insertRule(rule);
        if (inserted) ruleMap.current[name] = inserted;
      } catch {
        // ignore
      }
    }
    setClassName(name);
  }, [insertRule]);

  return { className, ensureCharClass } as const;
}
