import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import squirrelImg from "./assets/animals/squirrel.webp";
import bearImg from "./assets/animals/bear.webp";
import fishImg from "./assets/animals/fish.webp";
import horseImg from "./assets/animals/horse.webp";
import duckImg from "./assets/animals/duck.webp";

import smashyKeys from "./assets/smashy-keys.webp";

import { words } from "./words";
import { names } from "./names";
import { useSpawner } from "./hooks/useSpawner";
import { useCharClass } from "./hooks/useCharClass";
import { randomFishTop, randomFishDuration } from "./utils/fish";
import { getRandomBackgroundColor } from "./utils/colors";

function App() {
  const [displayChar, setDisplayChar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ff6b6b");
  const [leftShiftPressed, setLeftShiftPressed] = useState(false);
  const [rightShiftPressed, setRightShiftPressed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [foundWord, setFoundWord] = useState("");
  const [wordFadingOut, setWordFadingOut] = useState(false);
  const [bearVisible, setBearVisible] = useState(false);
  const [duckVisible, setDuckVisible] = useState(false);
  const [fontIndex, setFontIndex] = useState(0);
  const fontClasses = ["font-a", "font-b", "font-c", "font-d"];
  const [typedWords, setTypedWords] = useState<string[]>([]);

  // Use refs for values that don't need to trigger re-renders
  const wordTimeoutRef = useRef<number | null>(null);
  const previousCharRef = useRef<string>("");
  const typedSequenceRef = useRef<string>("");
  const bearTimeoutRef = useRef<number | null>(null);
  const duckTimeoutRef = useRef<number | null>(null);

  const {
    list: fishList,
    spawn: spawnFish,
    remove: removeFish,
  } = useSpawner("fish", randomFishTop, randomFishDuration);

  const {
    list: horseList,
    spawn: spawnHorse,
    remove: removeHorse,
  } = useSpawner("horse", () => {
    // keep horses lower on the page
    const y = Math.floor(Math.random() * (88 - 70 + 1)) + 70; // 70..88
    return `${y}%`;
  }, randomFishDuration);
  const { className: displayCharClass, ensureCharClass } = useCharClass();

  // Helper comment: fish/horse spawning handled by generic `useSpawner` hook

  

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
      const found = longestMatch.toLowerCase();
      setFoundWord(found);
      // add to typed-words list shown on the right
      setTypedWords((prev) => [found, ...prev]);
      setWordFadingOut(false);

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
  }, [spawnFish, spawnHorse]);

  // Create or reuse a CSS class for the given character color to avoid inline styles
  // character classes are handled by `useCharClass` hook

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
      // Delete/Backspace -> duck popup (hold to show; release hides)
      if ((code === "Delete" || code === "Backspace" || key === "Delete" || key === "Backspace") && !event.repeat) {
        event.preventDefault();
        setDuckVisible(true);
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
        // rotate font on repeated presses
        setFontIndex((prev) => (prev + 1) % fontClasses.length);
      } else if (newChar) {
        // reset to default font for new characters
        setFontIndex(0);
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
      // Hide duck on Delete/Backspace release
      if (code === "Delete" || code === "Backspace" || event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        setDuckVisible(false);
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
  }, [checkForWords, ensureCharClass, spawnFish, fontClasses.length]);

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
      if (bearTimeoutRef.current) {
        clearTimeout(bearTimeoutRef.current);
      }
      if (duckTimeoutRef.current) {
        clearTimeout(duckTimeoutRef.current);
      }
    };
  }, []);

  // Remove a fish when its animation ends
  // fish removal handled by `useFishSpawner`'s removeFish

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

      {/* Duck (pops from bottom center when Delete is held) */}
      <img
        src={duckImg}
        alt="Duck"
        className={`duck ${duckVisible ? "duck-pop" : ""}`}
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

      {/* Horses (run across when spawned) */}
      {horseList.map((h) => (
        <img
          key={`horse-${h.id}`}
          src={horseImg}
          alt="Horse"
          className={`horse horse-id-${h.id} ${h.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"}`}
          onAnimationEnd={() => removeHorse(h.id)}
        />
      ))}

      {displayChar ? (
        <div className="display-container">
          <div key={animationKey} className={`display-char ${displayCharClass} ${fontClasses[fontIndex]}`}>
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
      {/* Right-side list of typed words */}
      <aside className="word-list" aria-live="polite">
        <h3>Typed Words</h3>
        <ul>
          {typedWords.map((w, i) => (
            <li key={`${w}-${i}`} className="word-list-item">
              {w}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default App;
