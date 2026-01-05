import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { words } from "../words";
import { names } from "../names";
import { buildPrefixTree, getNextChars } from "../utils/prefixTree";
import type { PrefixNode } from "../utils/prefixTree";
import { useWordDetection } from "./useWordDetection";
import { getRandomDarkColor } from "../utils/colors";

export type WordStateDeps = {
  includeNames: boolean;
  spawnFish: (direction: "ltr" | "rtl") => void;
  spawnHorse: (direction: "ltr" | "rtl") => void;
  setBearVisible: (visible: boolean) => void;
  setDuckVisible: (visible: boolean) => void;
};

export function useWordState({
  includeNames,
  spawnFish,
  spawnHorse,
  setBearVisible,
  setDuckVisible,
}: WordStateDeps) {
  const wordList = useMemo(
    () => (includeNames ? [...words, ...names] : words),
    [includeNames]
  );

  const prefixTreeRef = useRef<PrefixNode>(buildPrefixTree(wordList));
  useEffect(() => {
    prefixTreeRef.current = buildPrefixTree(wordList);
  }, [wordList]);

  const [foundWord, setFoundWord] = useState("");
  const [wordFadingOut, setWordFadingOut] = useState(false);
  const [typedWords, setTypedWords] = useState<string[]>([]);

  const [capsLockOn, setCapsLockOn] = useState(false);
  const [currentWordColor, setCurrentWordColor] = useState<string | null>(null);
  const [currentFontIndex, setCurrentFontIndex] = useState(1);
  const [desktopTypedSequence, setDesktopTypedSequence] = useState("");
  const [desktopTypedSequenceDisplay, setDesktopTypedSequenceDisplay] =
    useState("");
  const [desktopNextLetters, setDesktopNextLetters] = useState<string[]>([]);
  const typedSequenceRef = useRef("");
  const typedSequenceDisplayRef = useRef("");

  const [mobileTypedSequence, setMobileTypedSequence] = useState("");
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);

  const { checkForWords, cleanup: cleanupWordDetection } = useWordDetection({
    onWordFound: (word: string) => {
      setFoundWord(word);
      setWordFadingOut(false);
    },
    spawnFish,
    spawnHorse,
    setBearVisible,
    setDuckVisible,
    setFoundWord,
    setWordFadingOut,
    setTypedWords,
  });

  const clearFoundWord = useCallback(() => {
    setFoundWord("");
    setWordFadingOut(false);
  }, []);

  const forceDisplayCase = useCallback((isUpper: boolean) => {
    setCapsLockOn(isUpper);
    const normalized = isUpper 
      ? typedSequenceDisplayRef.current.toUpperCase()
      : typedSequenceDisplayRef.current.toLowerCase();
    typedSequenceDisplayRef.current = normalized;
    setDesktopTypedSequenceDisplay((prev) =>
      isUpper ? prev.toUpperCase() : prev.toLowerCase()
    );
    setDesktopNextLetters((prev) =>
      prev.map((l) => (isUpper ? l.toUpperCase() : l.toLowerCase()))
    );
  }, []);

  const handleDesktopLetterInput = useCallback(
    (newChar: string) => {
      const newSequence = typedSequenceRef.current + newChar.toLowerCase();
      const normalizedChar = capsLockOn ? newChar.toUpperCase() : newChar.toLowerCase();
      const newDisplaySequence = typedSequenceDisplayRef.current + normalizedChar;
      const trimmedSequence = newSequence.slice(-10);
      const trimmedDisplaySequence = newDisplaySequence.slice(-10);

      // Set color on first letter
      if (typedSequenceRef.current === "") {
        setCurrentWordColor(getRandomDarkColor());
      }

      const isComplete = wordList.some(
        (w) => w.toLowerCase() === trimmedSequence
      );

      let nextLetters = getNextChars(trimmedSequence, prefixTreeRef.current);
      let finalSequence = trimmedSequence;
      let finalDisplaySequence = trimmedDisplaySequence;

      if (nextLetters.length === 0 && trimmedSequence.length > 1 && !isComplete) {
        // Restarting with a new letter - pick a new color
        setCurrentWordColor(getRandomDarkColor());
        finalSequence = newChar.toLowerCase();
        finalDisplaySequence = normalizedChar;
        nextLetters = getNextChars(finalSequence, prefixTreeRef.current);
      }

      typedSequenceRef.current = finalSequence;
      typedSequenceDisplayRef.current = finalDisplaySequence;

      if (foundWord) {
        clearFoundWord();
      }

      checkForWords(finalSequence);

      setDesktopTypedSequence(finalSequence);
      setDesktopTypedSequenceDisplay(finalDisplaySequence);
      setDesktopNextLetters(
        nextLetters.map((l) => (capsLockOn ? l.toUpperCase() : l.toLowerCase()))
      );

      return { displaySequence: finalDisplaySequence, nextLetters } as const;
    },
    [capsLockOn, checkForWords, clearFoundWord, foundWord, wordList]
  );

  const resetDesktopSequences = useCallback(() => {
    typedSequenceRef.current = "";
    typedSequenceDisplayRef.current = "";
    setDesktopTypedSequence("");
    setDesktopTypedSequenceDisplay("");
    setDesktopNextLetters([]);
    setCurrentWordColor(null);
  }, []);

  const handleMobileTap = useCallback(() => {
    const possibleLetters = mobileTypedSequence
      ? getNextChars(mobileTypedSequence, prefixTreeRef.current)
      : Object.keys(prefixTreeRef.current);

    if (possibleLetters.length === 0) return [] as string[];

    const shuffled = [...possibleLetters].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setAvailableLetters(selected);
    return selected;
  }, [mobileTypedSequence]);

  const handleLetterTap = useCallback(
    (letter: string, isMobile: boolean) => {
      const currentSequence = isMobile
        ? mobileTypedSequence
        : typedSequenceRef.current;
      const currentDisplaySequence = isMobile
        ? mobileTypedSequence
        : typedSequenceDisplayRef.current;

      // Set color on first letter
      if (currentSequence === "") {
        setCurrentWordColor(getRandomDarkColor());
      }

      const newSequence = currentSequence + letter.toLowerCase();
      const displayLetter = capsLockOn ? letter.toUpperCase() : letter.toLowerCase();
      const newDisplaySequence = currentDisplaySequence + displayLetter;

      if (isMobile) {
        setMobileTypedSequence(newSequence);
        setAvailableLetters([]);
      } else {
        typedSequenceRef.current = newSequence;
        typedSequenceDisplayRef.current = newDisplaySequence;
        setDesktopTypedSequence(newSequence);
        setDesktopTypedSequenceDisplay(newDisplaySequence);
      }

      const possibleNextLetters = getNextChars(
        newSequence,
        prefixTreeRef.current
      );
      const isCompleteWord =
        possibleNextLetters.length === 0 ||
        wordList.some((w) => w.toLowerCase() === newSequence);

      if (isCompleteWord) {
        const displaySeq = isMobile
          ? newSequence.toUpperCase()
          : newDisplaySequence;
        setFoundWord(newSequence);
        checkForWords(newSequence);

        setTimeout(() => {
          if (isMobile) {
            setMobileTypedSequence("");
          } else {
            resetDesktopSequences();
          }
          setAvailableLetters([]);
          setFoundWord("");
        }, 2000);

        return { displaySequence: displaySeq, isCompleteWord: true } as const;
      }

      if (!isMobile) {
        setDesktopNextLetters(
          possibleNextLetters.map((l) => (capsLockOn ? l.toUpperCase() : l.toLowerCase()))
        );
      }

      const displaySeq = isMobile
        ? newSequence.toUpperCase()
        : newDisplaySequence;

      return {
        displaySequence: displaySeq,
        isCompleteWord: false,
        nextLetters: possibleNextLetters,
      } as const;
    },
    [checkForWords, mobileTypedSequence, resetDesktopSequences, wordList, capsLockOn]
  );

  return {
    wordList,
    prefixTreeRef,
    foundWord,
    wordFadingOut,
    typedWords,
    desktopTypedSequence,
    desktopTypedSequenceDisplay,
    desktopNextLetters,
    mobileTypedSequence,
    availableLetters,
    capsLockOn,
    currentWordColor,
    currentFontIndex,
    setCurrentFontIndex,
    handleDesktopLetterInput,
    handleMobileTap,
    handleLetterTap,
    resetDesktopSequences,
    forceDisplayCase,
    clearFoundWord,
    cleanupWordDetection,
  } as const;
}
