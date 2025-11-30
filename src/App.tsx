import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const [desktopTypedSequenceDisplay, setDesktopTypedSequenceDisplay] = useState<string>("");
  const [desktopNextLetters, setDesktopNextLetters] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [includeNames, setIncludeNames] = useState(() => {
    const saved = localStorage.getItem('includeNames');
    return saved ? JSON.parse(saved) : false;
  });
  const [showNextLetters, setShowNextLetters] = useState(() => {
    const saved = localStorage.getItem('showNextLetters');
    return saved ? JSON.parse(saved) : true;
  });

  // Use refs for values that don't need to trigger re-renders
  const previousCharRef = useRef<string>("");
  const typedSequenceRef = useRef<string>("");
  const typedSequenceDisplayRef = useRef<string>("");

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

  // Compute word list based on settings
  const wordList = useMemo(() => 
    includeNames ? [...words, ...names] : words,
    [includeNames]
  );

  // Build prefix tree for mobile word detection - rebuild when includeNames changes
  const prefixTreeRef = useRef(buildPrefixTree(wordList));
  
  useEffect(() => {
    prefixTreeRef.current = buildPrefixTree(wordList);
  }, [wordList]);

  // Word detection and special behaviors
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for all keys
      event.preventDefault();
      
      const key = event.key;
      const code = event.code;

      // Handle caps lock toggle - update display case without clearing sequence
      if (code === "CapsLock") {
        const newCapsLockState = event.getModifierState("CapsLock");
        
        // Toggle the case of the current display sequence
        if (desktopTypedSequenceDisplay) {
          const toggledDisplay = newCapsLockState 
            ? desktopTypedSequenceDisplay.toUpperCase()
            : desktopTypedSequenceDisplay.toLowerCase();
          setDesktopTypedSequenceDisplay(toggledDisplay);
          typedSequenceDisplayRef.current = toggledDisplay;
          setDisplayChar(toggledDisplay);
          ensureCharClass(toggledDisplay);
        }
        
        // Toggle the case of next letters display
        if (desktopNextLetters.length > 0) {
          const toggledNextLetters = desktopNextLetters.map(letter => 
            newCapsLockState ? letter.toUpperCase() : letter.toLowerCase()
          );
          setDesktopNextLetters(toggledNextLetters);
        }
        
        return; // Don't process further for caps lock
      }

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
          const newDisplaySequence = typedSequenceDisplayRef.current + newChar;
          // Keep only the last 10 characters to prevent memory issues
          const trimmedSequence = newSequence.slice(-10);
          const trimmedDisplaySequence = newDisplaySequence.slice(-10);
          
          // Check if this is a complete word
          const isComplete = wordList.some(w => w.toLowerCase() === trimmedSequence);
          
          // Check if there are next letters for this sequence
          const nextLetters = getNextChars(trimmedSequence, prefixTreeRef.current);
          
          // If no next letters and not a complete word, restart sequence with just the current letter
          let finalSequence = trimmedSequence;
          let finalDisplaySequence = trimmedDisplaySequence;
          let finalNextLetters = nextLetters;
          if (nextLetters.length === 0 && trimmedSequence.length > 1 && !isComplete) {
            // No matches and not a complete word - restart with just the last letter
            finalSequence = newChar.toLowerCase();
            finalDisplaySequence = newChar;
            finalNextLetters = getNextChars(finalSequence, prefixTreeRef.current);
          }
          
          typedSequenceRef.current = finalSequence;
          typedSequenceDisplayRef.current = finalDisplaySequence;
          
          // Clear any previous found word when starting to type
          if (foundWord) {
            setFoundWord("");
            setWordFadingOut(false);
          }
          
          checkForWords(finalSequence);

          // Update desktop word building state
          setDesktopTypedSequence(finalSequence);
          setDesktopTypedSequenceDisplay(finalDisplaySequence);
          setDesktopNextLetters(finalNextLetters);
          
          // Set display to show the sequence for word building
          setDisplayChar(finalDisplaySequence);
          ensureCharClass(finalDisplaySequence);
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
          // Don't clear desktop word building for non-letter characters
          // Keep the partial word and next letters visible
        }
      }
      // Don't clear word building state for non-displayable keys (Shift, etc.)
      // This preserves partial words and next letters when special keys are pressed
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
  }, [checkForWords, ensureCharClass, spawnFish, fontClasses.length, foundWord, desktopTypedSequenceDisplay, desktopNextLetters, wordList]);

  // Keep the CSS variable for background in sync (avoid inline root styles)
  useEffect(() => {
    document.documentElement.style.setProperty("--bg-color", backgroundColor);
  }, [backgroundColor]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('includeNames', JSON.stringify(includeNames));
  }, [includeNames]);

  useEffect(() => {
    localStorage.setItem('showNextLetters', JSON.stringify(showNextLetters));
  }, [showNextLetters]);

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
    (letter: string, event?: React.MouseEvent | React.TouchEvent) => {
      event?.stopPropagation();

      // Determine current sequence based on device type
      const currentSequence = isMobile ? mobileTypedSequence : desktopTypedSequence;
      const currentDisplaySequence = isMobile ? mobileTypedSequence : (typedSequenceDisplayRef.current || "");
      
      // Add letter to typed sequence (lowercase for matching, uppercase for display)
      const newSequence = currentSequence + letter.toLowerCase();
      const newDisplaySequence = currentDisplaySequence + letter.toUpperCase();
      
      if (isMobile) {
        setMobileTypedSequence(newSequence);
        // Clear available letters immediately
        setAvailableLetters([]);
      } else {
        // Desktop mode - update desktop sequence and refs
        typedSequenceRef.current = newSequence;
        typedSequenceDisplayRef.current = newDisplaySequence;
        setDesktopTypedSequence(newSequence);
        setDesktopTypedSequenceDisplay(newDisplaySequence);
      }

      // Change background color
      setBackgroundColor(getRandomBackgroundColor());

      // Check if this completes a word
      const possibleNextLetters = getNextChars(
        newSequence,
        prefixTreeRef.current
      );
      const isCompleteWord =
        possibleNextLetters.length === 0 ||
        wordList.some((w) => w.toLowerCase() === newSequence);

      if (isCompleteWord) {
        // Word is complete - show it in center and check for special behaviors
        const displaySeq = isMobile ? newSequence.toUpperCase() : newDisplaySequence;
        setDisplayChar(displaySeq);
        ensureCharClass(displaySeq);
        setFoundWord(newSequence);
        // checkForWords will add to typedWords, so don't add here
        checkForWords(newSequence);

        // Reset sequence after a delay
        setTimeout(() => {
          if (isMobile) {
            setMobileTypedSequence("");
          } else {
            setDesktopTypedSequence("");
            setDesktopTypedSequenceDisplay("");
            setDesktopNextLetters([]);
            typedSequenceRef.current = "";
            typedSequenceDisplayRef.current = "";
          }
          setDisplayChar("");
          setFoundWord("");
        }, 2000);
      } else {
        // Show the current sequence (not just the letter)
        const displaySeq = isMobile ? newSequence.toUpperCase() : newDisplaySequence;
        setDisplayChar(displaySeq);
        ensureCharClass(displaySeq);
        
        // Update next letters for desktop
        if (!isMobile) {
          setDesktopNextLetters(possibleNextLetters);
        }
      }
    },
    [isMobile, mobileTypedSequence, desktopTypedSequence, ensureCharClass, checkForWords, wordList]
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
      {/* Settings button */}
      <button 
        className="settings-button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="settings-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button 
                className="modal-close"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="setting-item">
                <label className="setting-label">
                  <span className="setting-title">Include Names</span>
                  <span className="setting-description">Allow names to be matched as words</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={includeNames}
                    onChange={(e) => setIncludeNames(e.target.checked)}
                    aria-label="Toggle include names"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label">
                  <span className="setting-title">Show Next Letters</span>
                  <span className="setting-description">Display available next letters during word building</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={showNextLetters}
                    onChange={(e) => setShowNextLetters(e.target.checked)}
                    aria-label="Toggle show next letters"
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {showNextLetters && (
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
          )}
        </div>
      ) : displayChar ? (
        <div className="display-container">
          {/* Desktop word building - show partial sequence and next letters */}
          {!isMobile && desktopTypedSequence && desktopNextLetters.length > 0 && !foundWord ? (
            <div className="desktop-word-building">
              <div className="desktop-sequence">
                {desktopTypedSequenceDisplay}
              </div>
              {showNextLetters && (
                <div className="desktop-next-letters">
                  {desktopNextLetters.map((letter, idx) => (
                  <span 
                    key={`${letter}-${idx}`} 
                    className="desktop-next-letter"
                    onClick={() => handleLetterTap(letter.toLowerCase())}
                  >
                    {letter}
                  </span>
                ))}
                </div>
              )}
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
