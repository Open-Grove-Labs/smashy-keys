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
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { useWordDetection } from "./hooks/useWordDetection";
import { randomFishTop, randomFishDuration } from "./utils/fish";
import { getRandomBackgroundColor } from "./utils/colors";
import { getDisplayCharFromKey } from "./utils/keyboard";
import { buildPrefixTree } from "./utils/prefixTree";
import { getNextChars } from "./utils/prefixTree";

function App() {
  // Device detection
  const { isMobile, isLandscape } = useDeviceDetection();

  const [displayChar, setDisplayChar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ff6b6b");
  const [leftShiftPressed, setLeftShiftPressed] = useState(false);
  const [rightShiftPressed, setRightShiftPressed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [foundWord, setFoundWord] = useState("");
  const [wordFadingOut, setWordFadingOut] = useState(false);
  const [bearVisible, setBearVisible] = useState(false);
  const [duckVisible, setDuckVisible] = useState(false);
  const [fontIndex, setFontIndex] = useState(1);
  const fontClasses = ["font-a", "font-b", "font-c", "font-d", "font-e", "font-f", "font-g", "font-h"];
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [mobileTypedSequence, setMobileTypedSequence] = useState<string>("");
  const [desktopTypedSequence, setDesktopTypedSequence] = useState<string>("");
  const [desktopNextLetters, setDesktopNextLetters] = useState<string[]>([]);

  // Use refs for values that don't need to trigger re-renders
  const previousCharRef = useRef<string>("");
  const typedSequenceRef = useRef<string>("");

  const {
    list: fishList,
    spawn: spawnFish,
    remove: removeFish,
  } = useSpawner("fish", randomFishTop, randomFishDuration);

  const {
    list: horseList,
    spawn: spawnHorse,
    remove: removeHorse,
  } = useSpawner(
    "horse",
    () => {
      // keep horses lower on the page
      const y = Math.floor(Math.random() * (88 - 70 + 1)) + 70; // 70..88
      return `${y}%`;
    },
    randomFishDuration
  );
  const { className: displayCharClass, ensureCharClass } = useCharClass();

  // Build prefix tree for mobile word detection
  const prefixTreeRef = useRef(buildPrefixTree([...words, ...names]));

  // Word detection and special behaviors
  const { checkForWords, cleanup: cleanupWordDetection } = useWordDetection({
    onWordFound: (word: string) => {
      setFoundWord(word);
      setTypedWords((prev) => [word, ...prev]);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for all keys
      event.preventDefault();
      
      const key = event.key;
      const code = event.code;

      // Handle shift keys for squirrel using event.code for better detection
      if (code === "ShiftLeft") {
        setLeftShiftPressed(true);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(true);
      }
      // Space bar -> bear popup (only on initial keydown)
      if ((code === "Space" || key === " ") && !event.repeat) {
        setBearVisible(true);
      }
      // Delete/Backspace -> duck popup (hold to show; release hides)
      if (
        (code === "Delete" ||
          code === "Backspace" ||
          key === "Delete" ||
          key === "Backspace") &&
        !event.repeat
      ) {
        setDuckVisible(true);
      }
      // Enter -> spawn a fish swimming left->right (each press spawns one)
      if (code === "Enter") {
        spawnFish("ltr");
      }

      // Tab -> spawn a flipped fish swimming right->left
      if (code === "Tab") {
        spawnFish("rtl");
      }

      // Change background color for every keypress
      setBackgroundColor(getRandomBackgroundColor());

      // Get display character from keyboard event
      const newChar = getDisplayCharFromKey(event);

      // Update character and typed sequence
      if (newChar) {
        // Update typed sequence for word detection (only for letters)
        if (/^[a-zA-Z]$/.test(newChar)) {
          // Check if same letter is being pressed again (for font rotation)
          if (newChar === previousCharRef.current) {
            setAnimationKey((prev) => prev + 1);
            // rotate font on repeated presses
            setFontIndex((prev) => (prev + 1) % fontClasses.length);
          } else {
            // reset to default font for new characters
            setFontIndex(1); // Start at index 1 (Fredoka One)
          }
          previousCharRef.current = newChar;
          const newSequence = typedSequenceRef.current + newChar.toLowerCase();
          // Keep only the last 10 characters to prevent memory issues
          const trimmedSequence = newSequence.slice(-10);
          
          // Check if this is a complete word
          const isComplete = [...words, ...names].some(w => w.toLowerCase() === trimmedSequence);
          
          // Check if there are next letters for this sequence
          const nextLetters = getNextChars(trimmedSequence, prefixTreeRef.current);
          
          // If no next letters and not a complete word, restart sequence with just the current letter
          let finalSequence = trimmedSequence;
          let finalNextLetters = nextLetters;
          if (nextLetters.length === 0 && trimmedSequence.length > 1 && !isComplete) {
            // No matches and not a complete word - restart with just the last letter
            finalSequence = newChar.toLowerCase();
            finalNextLetters = getNextChars(finalSequence, prefixTreeRef.current);
          }
          
          typedSequenceRef.current = finalSequence;
          
          // Clear any previous found word when starting to type
          if (foundWord) {
            setFoundWord("");
            setWordFadingOut(false);
          }
          
          checkForWords(finalSequence);

          // Update desktop word building state
          setDesktopTypedSequence(finalSequence);
          setDesktopNextLetters(finalNextLetters);
          
          // Set display to show the sequence for word building
          setDisplayChar(finalSequence.toUpperCase());
          ensureCharClass(finalSequence.toUpperCase());
        } else {
          // Non-letter key pressed, show just that character
          // Check if same key is being pressed again (for font rotation)
          if (newChar === previousCharRef.current) {
            setAnimationKey((prev) => prev + 1);
            // rotate font on repeated presses
            setFontIndex((prev) => (prev + 1) % fontClasses.length);
          } else {
            // reset to default font for new characters
            setFontIndex(1); // Start at index 1 (Fredoka One)
          }
          previousCharRef.current = newChar;
          
          setDisplayChar(newChar);
          ensureCharClass(newChar);
          setDesktopTypedSequence("");
          setDesktopNextLetters([]);
        }
      } else if (key !== "Shift") {
        setDisplayChar("");
        ensureCharClass("");
        // Reset typed sequence when non-letter key is pressed
        typedSequenceRef.current = "";
        setDesktopTypedSequence("");
        setDesktopNextLetters([]);
        previousCharRef.current = "";
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Prevent default behavior for all keys
      event.preventDefault();
      
      const code = event.code;

      // Handle shift key releases using event.code
      if (code === "ShiftLeft") {
        setLeftShiftPressed(false);
      } else if (code === "ShiftRight") {
        setRightShiftPressed(false);
      }
      // Hide bear on space release
      if (code === "Space") {
        setBearVisible(false);
      }
      // Hide duck on Delete/Backspace release
      if (
        code === "Delete" ||
        code === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        setDuckVisible(false);
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [checkForWords, ensureCharClass, spawnFish, fontClasses.length, foundWord]);

  // Keep the CSS variable for background in sync (avoid inline root styles)
  useEffect(() => {
    document.documentElement.style.setProperty("--bg-color", backgroundColor);
  }, [backgroundColor]);

  // Handle mobile tap to select random letters
  const handleMobileTap = useCallback(() => {
    // If there's a current sequence, get next possible letters
    // Otherwise get top-level letters
    const possibleLetters = mobileTypedSequence
      ? getNextChars(mobileTypedSequence, prefixTreeRef.current)
      : Object.keys(prefixTreeRef.current);

    if (possibleLetters.length === 0) return;

    // Randomly select up to 3 letters
    const shuffled = [...possibleLetters].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setAvailableLetters(selected);

    // Change background color
    setBackgroundColor(getRandomBackgroundColor());

    // Remove the starting text by setting a display char
    setDisplayChar("");
  }, [mobileTypedSequence]);

  // Handle tapping a specific letter on mobile
  const handleLetterTap = useCallback(
    (letter: string, event: React.MouseEvent | React.TouchEvent) => {
      event.stopPropagation();

      // Add letter to typed sequence
      const newSequence = mobileTypedSequence + letter.toLowerCase();
      setMobileTypedSequence(newSequence);

      // Clear available letters immediately
      setAvailableLetters([]);

      // Change background color
      setBackgroundColor(getRandomBackgroundColor());

      // Check if this completes a word
      const possibleNextLetters = getNextChars(
        newSequence,
        prefixTreeRef.current
      );
      const isCompleteWord =
        possibleNextLetters.length === 0 ||
        [...words, ...names].some((w) => w.toLowerCase() === newSequence);

      if (isCompleteWord) {
        // Word is complete - show it in center and check for special behaviors
        setDisplayChar(newSequence.toUpperCase());
        ensureCharClass(newSequence.toUpperCase());
        setFoundWord(newSequence);
        // checkForWords will add to typedWords, so don't add here
        checkForWords(newSequence);

        // Reset sequence after a delay
        setTimeout(() => {
          setMobileTypedSequence("");
          setDisplayChar("");
          setFoundWord("");
        }, 2000);
      } else {
        // Show the current sequence (not just the letter)
        setDisplayChar(newSequence.toUpperCase());
        ensureCharClass(newSequence.toUpperCase());
      }
    },
    [mobileTypedSequence, ensureCharClass, checkForWords]
  );

  // Add touch event listener for mobile (only when no letters showing)
  useEffect(() => {
    if (!isMobile || availableLetters.length > 0) return;

    const handleTouch = (event: TouchEvent) => {
      event.preventDefault();
      handleMobileTap();
    };

    window.addEventListener("touchstart", handleTouch, { passive: false });
    return () => window.removeEventListener("touchstart", handleTouch);
  }, [isMobile, handleMobileTap, availableLetters.length]);

  // Cleanup on unmount
  useEffect(() => {
    console.log("Device detection:", isMobile ? "MOBILE" : "DESKTOP");
    return cleanupWordDetection;
  }, [isMobile, cleanupWordDetection]);

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
          className={`fish fish-id-${f.id} ${
            f.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"
          }`}
          onAnimationEnd={() => removeFish(f.id)}
        />
      ))}

      {/* Horses (run across when spawned) */}
      {horseList.map((h) => (
        <img
          key={`horse-${h.id}`}
          src={horseImg}
          alt="Horse"
          className={`horse horse-id-${h.id} ${
            h.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"
          }`}
          onAnimationEnd={() => removeHorse(h.id)}
        />
      ))}

      {isMobile && availableLetters.length > 0 ? (
        <div className={`mobile-word-building ${isLandscape ? 'landscape' : ''}`}>
          {/* Current sequence */}
          {mobileTypedSequence && (
            <div className={`mobile-sequence ${isLandscape ? 'landscape' : ''}`}>
              {mobileTypedSequence.toUpperCase()}
            </div>
          )}

          {/* Available next letters */}
          <div className={`mobile-letter-display ${isLandscape ? 'landscape' : ''}`}>
            {availableLetters.map((letter, idx) => (
              <div
                key={`${letter}-${idx}`}
                className="mobile-letter"
                onClick={(e) => handleLetterTap(letter, e)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleLetterTap(letter, e);
                }}
              >
                {letter.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      ) : displayChar ? (
        <div className="display-container">
          {/* Desktop word building - show partial sequence and next letters */}
          {!isMobile && desktopTypedSequence && desktopNextLetters.length > 0 && !foundWord ? (
            <div className="desktop-word-building">
              <div className="desktop-sequence">
                {desktopTypedSequence.toUpperCase()}
              </div>
              <div className="desktop-next-letters">
                {desktopNextLetters.map((letter, idx) => (
                  <span key={`${letter}-${idx}`} className="desktop-next-letter">
                    {letter.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div
              key={animationKey}
              className={`display-char ${displayCharClass} ${fontClasses[fontIndex]}`}
            >
              {displayChar}
            </div>
          )}
          {foundWord && (
            <div className={`found-word ${wordFadingOut ? "fading-out" : ""}`}>
              {foundWord}
            </div>
          )}
        </div>
      ) : (
        <div className="instructions">
          <img height="200" title="smashy keys logo" src={smashyKeys} />
          {isMobile ? (
            <>
              <h1>Smashy Keys</h1>
              <h2>Mobile Edition</h2>
              <p>Press any key!</p>
            </>
          ) : (
            <>
              <h1>Smashy Keys</h1>
              <p>Press any key!</p>
              <p className="caps-lock-hint">Letters, numbers, or arrow keys</p>
            </>
          )}
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
