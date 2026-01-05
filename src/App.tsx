import { useCallback, useEffect, useState } from "react";
import "./App.css";

import smashyKeys from "./assets/smashy-keys.webp";

import { useSpawner } from "./hooks/useSpawner";
import { useCharClass } from "./hooks/useCharClass";
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { useSettings } from "./hooks/useSettings";
import { useWordState } from "./hooks/useWordState";
import { useKeyboardControls } from "./hooks/useKeyboardControls";
import { getRandomBackgroundColor } from "./utils/colors";
import { randomFishDuration, randomFishTop } from "./utils/fish";
import { CritterLayer } from "./components/CritterLayer";
import { SettingsModal } from "./components/SettingsModal";
import { WordDisplay } from "./components/WordDisplay";
import { DesktopWordBuilder } from "./components/DesktopWordBuilder";
import { MobileWordBuilder } from "./components/MobileWordBuilder";
import { TypedWordList } from "./components/TypedWordList";

function App() {
  const { isMobile, isLandscape } = useDeviceDetection();
  const { includeNames, setIncludeNames } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<"classic" | "spelling">("classic");

  // Mobile always shows next letters, desktop only in spelling mode
  const showNextLetters = isMobile || mode === "spelling";

  const [bearVisible, setBearVisible] = useState(false);
  const [duckVisible, setDuckVisible] = useState(false);

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
      const y = Math.floor(Math.random() * (88 - 70 + 1)) + 70;
      return `${y}%`;
    },
    randomFishDuration
  );

  const { className: displayCharClass, ensureCharClass } = useCharClass();

  const wordState = useWordState({
    includeNames,
    spawnFish,
    spawnHorse,
    setBearVisible,
    setDuckVisible,
  });

  const {
    displayChar,
    setDisplayChar,
    setBackgroundColor,
    leftShiftPressed,
    rightShiftPressed,
    animationKey,
    fontIndex,
    fontClasses,
  } = useKeyboardControls({
    isMobile,
    ensureCharClass,
    spawnFish,
    setBearVisible,
    setDuckVisible,
    wordState,
  });

  const handleMobileTap = useCallback(() => {
    const possibleLetters = wordState.handleMobileTap();
    if (possibleLetters.length === 0) return;
    setBackgroundColor(getRandomBackgroundColor());
    setDisplayChar("");
  }, [setBackgroundColor, setDisplayChar, wordState]);

  const handleLetterTap = useCallback(
    (letter: string, event?: React.MouseEvent | React.TouchEvent) => {
      event?.stopPropagation();
      const { displaySequence } = wordState.handleLetterTap(letter, isMobile);
      setBackgroundColor(getRandomBackgroundColor());
      setDisplayChar(displaySequence);
      ensureCharClass(displaySequence, wordState.currentWordColor || undefined);
    },
    [ensureCharClass, isMobile, setBackgroundColor, setDisplayChar, wordState]
  );

  useEffect(() => {
    if (!isMobile || wordState.availableLetters.length > 0) return;

    const handleTouch = (event: TouchEvent) => {
      event.preventDefault();
      handleMobileTap();
    };

    window.addEventListener("touchstart", handleTouch, { passive: false });
    return () => window.removeEventListener("touchstart", handleTouch);
  }, [handleMobileTap, isMobile, wordState.availableLetters.length]);

  useEffect(
    () => wordState.cleanupWordDetection,
    [wordState.cleanupWordDetection]
  );

  const showDesktopBuilder =
    !isMobile &&
    wordState.desktopTypedSequence &&
    wordState.desktopNextLetters.length > 0 &&
    !wordState.foundWord;

  return (
    <div className="toddler-app">
      <div className="settings-container">
        <button
          className="settings-button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="settings-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
        {!isMobile && (
          <button
            className="mode-toggle-button"
            onClick={() =>
              setMode((prev) => (prev === "classic" ? "spelling" : "classic"))
            }
            aria-label="Toggle mode"
            title={
              mode === "classic"
                ? "Switch to Spelling mode"
                : "Switch to Classic mode"
            }
          >
            {mode === "classic" ? "Switch to Spelling" : "Switch to Classic"}
          </button>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        includeNames={includeNames}
        onIncludeNamesChange={setIncludeNames}
      />

      <CritterLayer
        leftShiftPressed={leftShiftPressed}
        rightShiftPressed={rightShiftPressed}
        bearVisible={bearVisible}
        duckVisible={duckVisible}
        fishList={fishList}
        horseList={horseList}
        removeFish={removeFish}
        removeHorse={removeHorse}
      />

      {isMobile && wordState.availableLetters.length > 0 ? (
        <MobileWordBuilder
          mobileTypedSequence={wordState.mobileTypedSequence}
          availableLetters={wordState.availableLetters}
          showNextLetters={showNextLetters}
          isLandscape={isLandscape}
          onLetterTap={handleLetterTap}
        />
      ) : displayChar ? (
        <div className="display-area">
          {showDesktopBuilder ? (
            <DesktopWordBuilder
              desktopTypedSequenceDisplay={
                wordState.desktopTypedSequenceDisplay
              }
              desktopNextLetters={wordState.desktopNextLetters}
              showNextLetters={showNextLetters}
              foundWord={wordState.foundWord}
              wordFadingOut={wordState.wordFadingOut}
              onLetterTap={(letter) => handleLetterTap(letter)}
              displayChar={displayChar}
              displayCharClass={displayCharClass}
              fontClass={fontClasses[fontIndex]}
              animationKey={animationKey}
            />
          ) : (
            <WordDisplay
              displayChar={displayChar}
              displayCharClass={displayCharClass}
              fontClass={fontClasses[fontIndex]}
              animationKey={animationKey}
              foundWord={wordState.foundWord}
              wordFadingOut={wordState.wordFadingOut}
            />
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

      <TypedWordList typedWords={wordState.typedWords} />
    </div>
  );
}

export default App;
