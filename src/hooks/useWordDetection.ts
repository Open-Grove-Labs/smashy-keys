import { useCallback, useRef } from "react";
import { words } from "../words";
import { names } from "../names";

interface UseWordDetectionProps {
  onWordFound: (word: string) => void;
  spawnFish: (direction: "ltr" | "rtl") => void;
  spawnHorse: (direction: "ltr" | "rtl") => void;
  setBearVisible: (visible: boolean) => void;
  setDuckVisible: (visible: boolean) => void;
  setFoundWord: (word: string) => void;
  setWordFadingOut: (fading: boolean) => void;
  setTypedWords: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useWordDetection({
  onWordFound,
  spawnFish,
  spawnHorse,
  setBearVisible,
  setDuckVisible,
  setFoundWord,
  setWordFadingOut,
  setTypedWords,
}: UseWordDetectionProps) {
  const wordTimeoutRef = useRef<number | null>(null);
  const bearTimeoutRef = useRef<number | null>(null);
  const duckTimeoutRef = useRef<number | null>(null);

  const checkForWords = useCallback(
    (sequence: string) => {
      const lowerSequence = sequence.toLowerCase();

      // Check if the sequence itself is an exact match
      let longestMatch = "";
      for (const word of [...words, ...names]) {
        if (lowerSequence === word.toLowerCase()) {
          longestMatch = word;
          break;
        }
      }

      if (longestMatch) {
        // Clear any existing timeout
        if (wordTimeoutRef.current) {
          clearTimeout(wordTimeoutRef.current);
          wordTimeoutRef.current = null;
        }

        // Show the word
        const found = longestMatch.toLowerCase();
        setFoundWord(found);
        // add to typed-words list shown on the right
        setTypedWords((prev) => [found, ...prev]);
        setWordFadingOut(false);

        // Trigger callback
        onWordFound(found);

        // If the word 'fish' was typed, spawn a bunch of fishes
        if (longestMatch.toLowerCase() === "fish") {
          // spawn 6-10 fish with slight stagger
          const count = 6 + Math.floor(Math.random() * 5);
          for (let i = 0; i < count; i++) {
            const delay = Math.floor(Math.random() * 600); // up to 600ms stagger
            setTimeout(() => {
              // randomize direction sometimes
              const dir = Math.random() < 0.85 ? "ltr" : "rtl";
              spawnFish(dir);
            }, delay);
          }
        }

        // If the word 'bear' was typed, show the bear briefly
        if (longestMatch.toLowerCase() === "bear") {
          if (bearTimeoutRef.current) {
            clearTimeout(bearTimeoutRef.current);
            bearTimeoutRef.current = null;
          }
          setBearVisible(true);
          bearTimeoutRef.current = window.setTimeout(() => {
            setBearVisible(false);
            bearTimeoutRef.current = null;
          }, 2000);
        }

        // If the word 'duck' was typed, show the duck briefly
        if (longestMatch.toLowerCase() === "duck") {
          if (duckTimeoutRef.current) {
            clearTimeout(duckTimeoutRef.current);
            duckTimeoutRef.current = null;
          }
          setDuckVisible(true);
          duckTimeoutRef.current = window.setTimeout(() => {
            setDuckVisible(false);
            duckTimeoutRef.current = null;
          }, 2000);
        }

        // If the word 'horse' was typed, spawn a running horse
        if (longestMatch.toLowerCase() === "horse") {
          // spawn one horse running left->right (or sometimes rtl)
          const dir = Math.random() < 0.85 ? "ltr" : "rtl";
          spawnHorse(dir);
        }

        // Start fade out after 1.5 seconds, then hide completely after fade animation
        wordTimeoutRef.current = setTimeout(() => {
          setWordFadingOut(true);
          // Hide completely after fade animation (0.5s)
          setTimeout(() => {
            setFoundWord("");
            setWordFadingOut(false);
            wordTimeoutRef.current = null;
          }, 500);
        }, 6000);
      }
    },
    [
      spawnFish,
      spawnHorse,
      onWordFound,
      setBearVisible,
      setDuckVisible,
      setFoundWord,
      setWordFadingOut,
      setTypedWords,
    ]
  );

  const cleanup = useCallback(() => {
    if (wordTimeoutRef.current) {
      clearTimeout(wordTimeoutRef.current);
    }
    if (bearTimeoutRef.current) {
      clearTimeout(bearTimeoutRef.current);
    }
    if (duckTimeoutRef.current) {
      clearTimeout(duckTimeoutRef.current);
    }
  }, []);

  return { checkForWords, cleanup };
}
