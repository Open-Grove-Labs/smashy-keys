import { useEffect, useRef, useState } from "react";
import { getRandomBackgroundColor } from "../utils/colors";
import { getDisplayCharFromKey } from "../utils/keyboard";
import type { WordStateDeps } from "./useWordState";
import { useWordState } from "./useWordState";

const FONT_CLASSES = [
  "font-a",
  "font-b",
  "font-c",
  "font-d",
  "font-e",
  "font-f",
  "font-g",
  "font-h",
];

type UseKeyboardControlsArgs = {
  isMobile: boolean;
  ensureCharClass: (char: string) => void;
  spawnFish: WordStateDeps["spawnFish"];
  setBearVisible: (visible: boolean) => void;
  setDuckVisible: (visible: boolean) => void;
  wordState: ReturnType<typeof useWordState>;
};

export function useKeyboardControls({
  isMobile,
  ensureCharClass,
  spawnFish,
  setBearVisible,
  setDuckVisible,
  wordState,
}: UseKeyboardControlsArgs) {
  const {
    forceDisplayCase,
    desktopTypedSequenceDisplay,
    handleDesktopLetterInput,
  } = wordState;
  const [displayChar, setDisplayChar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ff6b6b");
  const [leftShiftPressed, setLeftShiftPressed] = useState(false);
  const [rightShiftPressed, setRightShiftPressed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [fontIndex, setFontIndex] = useState(1);

  const previousCharRef = useRef<string>("");

  useEffect(() => {
    document.documentElement.style.setProperty("--bg-color", backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();

      const key = event.key;
      const code = event.code;

      if (code === "CapsLock") {
        const newCapsLockState = event.getModifierState("CapsLock");
        forceDisplayCase(newCapsLockState);
        if (desktopTypedSequenceDisplay) {
          const toggled = newCapsLockState
            ? desktopTypedSequenceDisplay.toUpperCase()
            : desktopTypedSequenceDisplay.toLowerCase();
          setDisplayChar(toggled);
          ensureCharClass(toggled);
        }
        return;
      }

      if (code === "ShiftLeft") {
        setLeftShiftPressed(true);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(true);
      }

      if ((code === "Space" || key === " ") && !event.repeat) {
        setBearVisible(true);
      }

      if (
        (code === "Delete" ||
          code === "Backspace" ||
          key === "Delete" ||
          key === "Backspace") &&
        !event.repeat
      ) {
        setDuckVisible(true);
      }

      if (code === "Enter") {
        spawnFish("ltr");
      }

      if (code === "Tab") {
        spawnFish("rtl");
      }

      setBackgroundColor(getRandomBackgroundColor());

      const newChar = getDisplayCharFromKey(event);
      if (!newChar) return;

      if (/^[a-zA-Z]$/.test(newChar) && !isMobile) {
        // Check if we're genuinely building a multi-letter word
        const currentSequence = desktopTypedSequenceDisplay.toLowerCase();
        const isRepeatedSingleLetter = currentSequence === "" || currentSequence === newChar.toLowerCase();
        
        if (isRepeatedSingleLetter && newChar.toLowerCase() === previousCharRef.current.toLowerCase()) {
          // Same letter pressed repeatedly (not building a word) - cycle font
          setAnimationKey((prev) => prev + 1);
          const newFontIndex = (fontIndex + 1) % FONT_CLASSES.length;
          setFontIndex(newFontIndex);
          wordState.setCurrentFontIndex(newFontIndex);
        } else if (currentSequence === "" || currentSequence === newChar.toLowerCase()) {
          // Different key or first press - choose random font
          setAnimationKey((prev) => prev + 1);
          const randomFontIndex = Math.floor(Math.random() * FONT_CLASSES.length);
          setFontIndex(randomFontIndex);
          wordState.setCurrentFontIndex(randomFontIndex);
        }
        // else: building a multi-letter word, preserve current font
        
        previousCharRef.current = newChar.toLowerCase();
        
        // Sync caps lock state before processing the letter
        const capsLockState = event.getModifierState("CapsLock");
        forceDisplayCase(capsLockState);
        const { displaySequence } = handleDesktopLetterInput(newChar);
        setDisplayChar(displaySequence);
        ensureCharClass(displaySequence);
      } else {
        // Non-letter key - use original font cycling logic
        if (newChar === previousCharRef.current) {
          setAnimationKey((prev) => prev + 1);
          setFontIndex((prev) => (prev + 1) % FONT_CLASSES.length);
        } else {
          setFontIndex(1);
        }
        previousCharRef.current = newChar;
        
        setDisplayChar(newChar);
        ensureCharClass(newChar);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      const code = event.code;

      if (code === "ShiftLeft") {
        setLeftShiftPressed(false);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(false);
      }

      if (code === "Space") {
        setBearVisible(false);
      }

      if (
        code === "Delete" ||
        code === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        setDuckVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    ensureCharClass,
    desktopTypedSequenceDisplay,
    forceDisplayCase,
    handleDesktopLetterInput,
    isMobile,
    setBearVisible,
    setDuckVisible,
    spawnFish,
    fontIndex,
    wordState
  ]);

  return {
    displayChar,
    setDisplayChar,
    backgroundColor,
    setBackgroundColor,
    leftShiftPressed,
    rightShiftPressed,
    animationKey,
    fontIndex,
    fontClasses: FONT_CLASSES,
  } as const;
}
