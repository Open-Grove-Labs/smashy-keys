import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import squirrelImg from "./assets/animals/squirrel.webp";
import bearImg from "./assets/animals/bear.webp";
import fishImg from "./assets/animals/fish.webp";
// import horseImg from "./assets/animals/horse.webp";
// import duckImg from "./assets/animals/duck.webp";

import smashyKeys from "./assets/smashy-keys.webp";

import { words } from "./words";
import { names } from "./names";
import { useDynamicSheet } from "./hooks/useDynamicSheet";
import { getCharColor, getRandomBackgroundColor } from "./utils/colors";
import { randomFishTop, randomFishDuration } from "./utils/fish";

function App() {
  const [displayChar, setDisplayChar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ff6b6b");
  const [leftShiftPressed, setLeftShiftPressed] = useState(false);
  const [rightShiftPressed, setRightShiftPressed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [foundWord, setFoundWord] = useState("");
  const [wordFadingOut, setWordFadingOut] = useState(false);
  const [bearVisible, setBearVisible] = useState(false);

  // Use refs for values that don't need to trigger re-renders
  const wordTimeoutRef = useRef<number | null>(null);
  const previousCharRef = useRef<string>("");
  const typedSequenceRef = useRef<string>("");
  const [fishList, setFishList] = useState<{
    id: number;
    top: string;
    duration: number;
    dir: "ltr" | "rtl";
  }[]>([]);
  const fishIdRef = useRef(0);
  const { insertRule, removeRuleContaining } = useDynamicSheet();
  const fishRuleRefs = useRef<Record<number, string>>({});
  const charRuleRefs = useRef<Record<string, string>>({});
  const [displayCharClass, setDisplayCharClass] = useState<string>("");

  // Helper to spawn a fish with randomized vertical position and duration
  const spawnFish = useCallback((dir: "ltr" | "rtl") => {
    const id = ++fishIdRef.current;
    const top = randomFishTop();
    const duration = randomFishDuration();
    setFishList((prev) => [...prev, { id, top, duration, dir }]);
    // create a per-fish CSS rule in the shared dynamic stylesheet
    try {
      const className = `fish-id-${id}`;
      const rule = `.fish.${className} { top: ${top}; animation-duration: ${duration}s; }`;
      const inserted = insertRule(rule);
      if (inserted) {
        fishRuleRefs.current[id] = inserted;
      }
    } catch {
      // ignore
    }
  }, [insertRule]);

  

  // color utilities moved to `src/utils/colors.ts`

  // Check if typed sequence contains any complete words
  const checkForWords = useCallback((sequence: string) => {
    const lowerSequence = sequence.toLowerCase();

    // Find the longest word that matches at the end of the sequence
    let longestMatch = "";
    for (const word of [...words, ...names]) {
      if (
        lowerSequence.endsWith(word.toLowerCase()) &&
        word.length > longestMatch.length
      ) {
        longestMatch = word;
      }
    }

    if (longestMatch) {
      // Clear any existing timeout
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }

      // Show the word
      setFoundWord(longestMatch.toLowerCase());
      setWordFadingOut(false);

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
  }, []);

  // Create or reuse a CSS class for the given character color to avoid inline styles
  const ensureCharClass = useCallback(
    (char: string) => {
      if (!/^[a-zA-Z0-9]$/.test(char)) {
        setDisplayCharClass("");
        return;
      }
      const safe = char.replace(/[^a-zA-Z0-9]/g, (c) => `_${c.charCodeAt(0)}`);
      const className = `char-${safe}`;
      if (!charRuleRefs.current[className]) {
        try {
          const color = getCharColor(char);
          const rule = `.${className} { --char-color: ${color}; }`;
          const inserted = insertRule(rule);
          if (inserted) charRuleRefs.current[className] = inserted;
        } catch {
          // ignore
        }
      }
      setDisplayCharClass(className);
    },
    [insertRule]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const code = event.code;

      // Handle shift keys for squirrel using event.code for better detection
      if (code === "ShiftLeft") {
        setLeftShiftPressed(true);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(true);
      }
      // Space bar -> bear popup (only on initial keydown, prevent page scroll)
      if ((code === 'Space' || key === ' ') && !event.repeat) {
        event.preventDefault();
        setBearVisible(true);
      }
      // Enter -> spawn a fish swimming left->right (each press spawns one)
      if (code === "Enter") {
        event.preventDefault();
        spawnFish("ltr");
      }

      // Tab -> spawn a flipped fish swimming right->left
      if (code === "Tab") {
        // prevent default so Tab doesn't move focus
        event.preventDefault();
        spawnFish("rtl");
      }

      // Update Caps Lock state
      // setIsCapsLock(event.getModifierState('CapsLock'))

      // Change background color for every keypress
      setBackgroundColor(getRandomBackgroundColor());

      let newChar = "";

      // Handle letters and numbers
      if (/^[a-zA-Z0-9]$/.test(key)) {
        // For letters, use the actual case based on Caps Lock and Shift
        if (/^[a-zA-Z]$/.test(key)) {
          // Check if Caps Lock is on
          const capsLockOn = event.getModifierState("CapsLock");
          const shiftPressed = event.shiftKey;

          // Determine if letter should be uppercase
          const shouldBeUppercase = capsLockOn !== shiftPressed; // XOR logic

          newChar = shouldBeUppercase ? key.toUpperCase() : key.toLowerCase();
        } else {
          // For numbers, always show as-is
          newChar = key;
        }
      }
      // Handle arrow keys
      else if (key === "ArrowUp") {
        newChar = "UP";
      } else if (key === "ArrowDown") {
        newChar = "DOWN";
      } else if (key === "ArrowLeft") {
        newChar = "LEFT";
      } else if (key === "ArrowRight") {
        newChar = "RIGHT";
      }

      // Check if same character is being pressed again and trigger bounce animation
      if (newChar && newChar === previousCharRef.current) {
        setAnimationKey((prev) => prev + 1);
      }
      previousCharRef.current =
        newChar || (key === "Shift" ? previousCharRef.current : "");

      // Update character and typed sequence
      if (newChar) {
        setDisplayChar(newChar);
        ensureCharClass(newChar);

        // Update typed sequence for word detection (only for letters)
        if (/^[a-zA-Z]$/.test(newChar)) {
          const newSequence = typedSequenceRef.current + newChar.toLowerCase();
          // Keep only the last 10 characters to prevent memory issues
          const trimmedSequence = newSequence.slice(-10);
          typedSequenceRef.current = trimmedSequence;
          checkForWords(trimmedSequence);
        }
      } else if (key !== "Shift") {
        setDisplayChar("");
        ensureCharClass("");
        // Reset typed sequence when non-letter key is pressed
        typedSequenceRef.current = "";
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const code = event.code;

      // Handle shift key releases using event.code
      if (code === "ShiftLeft") {
        setLeftShiftPressed(false);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(false);
      }
      // Hide bear on space release
      if (code === 'Space') {
        event.preventDefault();
        setBearVisible(false);
      }
      // nothing special on Enter keyup — fish hides automatically after animation
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [checkForWords, ensureCharClass, spawnFish]);

  // Keep the CSS variable for background in sync (avoid inline root styles)
  useEffect(() => {
    document.documentElement.style.setProperty("--bg-color", backgroundColor);
  }, [backgroundColor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
      }
    };
  }, []);

  // Remove a fish when its animation ends
  const removeFish = (id: number) => {
    setFishList((prev) => prev.filter((x) => x.id !== id));
    // remove any rule referencing this fish-id
    removeRuleContaining(`fish-id-${id}`);
    delete fishRuleRefs.current[id];
  };

  return (
    <div className="toddler-app">
      {/* Left squirrel */}
      <img
        src={squirrelImg}
        alt="Squirrel"
        className={`squirrel squirrel-left ${
          leftShiftPressed ? "squirrel-peek" : ""
        }`}
      />

      {/* Right squirrel */}
      <img
        src={squirrelImg}
        alt="Squirrel"
        className={`squirrel squirrel-right ${
          rightShiftPressed ? "squirrel-peek" : ""
        }`}
      />

      {/* Bear (pops from bottom center when Space is held) */}
      <img
        src={bearImg}
        alt="Bear"
        className={`bear ${bearVisible ? "bear-pop" : ""}`}
      />

      {/* Fish (swim left -> right on Enter) - multiple instances */}
      {fishList.map((f) => (
        <img
          key={f.id}
          src={fishImg}
          alt="Fish"
          className={`fish fish-id-${f.id} ${f.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"}`}
          onAnimationEnd={() => removeFish(f.id)}
        />
      ))}

      {displayChar ? (
        <div className="display-container">
          <div key={animationKey} className={`display-char ${displayCharClass}`}>
            {displayChar}
          </div>
          {foundWord && (
            <div className={`found-word ${wordFadingOut ? "fading-out" : ""}`}>
              {foundWord}
            </div>
          )}
        </div>
      ) : (
        <div className="instructions">
          <img height="200" title="smashy keys logo" src={smashyKeys} />
          <h1>Press any key!</h1>
          <p>Letters, numbers, or arrow keys</p>
          <p className="caps-lock-hint">Use Caps Lock for UPPERCASE letters!</p>
        </div>
      )}
    </div>
  );
}

export default App;
