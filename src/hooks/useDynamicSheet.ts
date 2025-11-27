import { useCallback, useEffect, useRef } from "react";

export function useDynamicSheet() {
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const sheetRef = useRef<CSSStyleSheet | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "dynamic-styles";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    styleElRef.current = el;
    sheetRef.current = el.sheet as CSSStyleSheet;

    return () => {
      if (styleElRef.current && styleElRef.current.parentNode) {
        styleElRef.current.parentNode.removeChild(styleElRef.current);
      }
      styleElRef.current = null;
      sheetRef.current = null;
    };
  }, []);

  const insertRule = useCallback((rule: string) => {
    const sheet = sheetRef.current;
    if (!sheet) return null;
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
      return rule;
    } catch {
      // ignore invalid rules in non-browser or other edge cases
      return null;
    }
  }, []);

  const removeRuleContaining = useCallback((needle: string) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      try {
        const r = sheet.cssRules[i] as CSSStyleRule;
        if (r.cssText.indexOf(needle) !== -1) {
          sheet.deleteRule(i);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  return { insertRule, removeRuleContaining };
}
