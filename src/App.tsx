import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import squirrelImg from "./assets/squirrel.png";
import { words } from "./words";

function App() {
  const [displayChar, setDisplayChar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ff6b6b");
  const [leftShiftPressed, setLeftShiftPressed] = useState(false);
  const [rightShiftPressed, setRightShiftPressed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [foundWord, setFoundWord] = useState("");
  const [wordFadingOut, setWordFadingOut] = useState(false);

  // Use refs for values that don't need to trigger re-renders
  const wordTimeoutRef = useRef<number | null>(null);
  const previousCharRef = useRef<string>("");
  const typedSequenceRef = useRef<string>("");

  // Predefined bright colors for letters and numbers
  const getCharColor = (char: string): string => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
      "#00d2d3",
      "#ff9f43",
      "#feca57",
      "#48dbfb",
      "#0abde3",
      "#006ba6",
      "#f0932b",
      "#eb4d4b",
      "#6c5ce7",
      "#a29bfe",
      "#fd79a8",
      "#fdcb6e",
      "#e17055",
      "#81ecec",
      "#74b9ff",
      "#00cec9",
      "#55a3ff",
      "#ff7675",
      "#fd79a8",
      "#a29bfe",
      "#6c5ce7",
      "#00b894",
      "#00cec9",
      "#0984e3",
      "#6c5ce7",
      "#e84393",
      "#fd79a8",
      "#fdcb6e",
    ];

    if (char >= "0" && char <= "9") {
      return colors[char.charCodeAt(0) - "0".charCodeAt(0)];
    }

    // Handle both lowercase and uppercase letters using the same color mapping
    if (char >= "a" && char <= "z") {
      return colors[10 + (char.charCodeAt(0) - "a".charCodeAt(0))];
    }

    if (char >= "A" && char <= "Z") {
      return colors[10 + (char.charCodeAt(0) - "A".charCodeAt(0))];
    }

    return "#ffffff";
  };

  // Generate random bright background colors
  const getRandomBackgroundColor = (): string => {
    const backgroundColors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
      "#00d2d3",
      "#ff9f43",
      "#48dbfb",
      "#0abde3",
      "#f0932b",
      "#eb4d4b",
      "#6c5ce7",
      "#fd79a8",
      "#fdcb6e",
      "#e17055",
      "#81ecec",
      "#74b9ff",
      "#00cec9",
      "#55a3ff",
      "#ff7675",
      "#a29bfe",
      "#00b894",
    ];
    return backgroundColors[
      Math.floor(Math.random() * backgroundColors.length)
    ];
  };

  // Check if typed sequence contains any complete words
  const checkForWords = useCallback((sequence: string) => {
    const lowerSequence = sequence.toLowerCase();

    // Find the longest word that matches at the end of the sequence
    let longestMatch = "";
    for (const word of words) {
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
      }, 1500);
    }
  }, []);

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
      previousCharRef.current = newChar || (key === "Shift" ? previousCharRef.current : "");

      // Update character and typed sequence
      if (newChar) {
        setDisplayChar(newChar);

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
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [checkForWords]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="toddler-app"
      style={{ "--bg-color": backgroundColor } as React.CSSProperties}
    >
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

      {displayChar ? (
        <div className="display-container">
          <div
            key={animationKey}
            className="display-char"
            style={
              {
                "--char-color": /^[a-zA-Z0-9]$/.test(displayChar)
                  ? getCharColor(displayChar)
                  : "#ffffff",
              } as React.CSSProperties
            }
          >
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
          <h1>Press any key!</h1>
          <p>Letters, numbers, or arrow keys</p>
          <p className="caps-lock-hint">Use Caps Lock for UPPERCASE letters!</p>
        </div>
      )}
    </div>
  );
}

export default App;
