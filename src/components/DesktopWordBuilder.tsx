import { WordDisplay } from "./WordDisplay";

interface DesktopWordBuilderProps {
  desktopTypedSequenceDisplay: string;
  desktopNextLetters: string[];
  showNextLetters: boolean;
  foundWord: string;
  wordFadingOut: boolean;
  displayChar: string;
  displayCharClass: string;
  fontClass: string;
  animationKey: number;
  onLetterTap: (letter: string) => void;
}

export function DesktopWordBuilder({
  desktopTypedSequenceDisplay,
  desktopNextLetters,
  showNextLetters,
  foundWord,
  wordFadingOut,
  displayChar,
  displayCharClass,
  fontClass,
  animationKey,
  onLetterTap,
}: DesktopWordBuilderProps) {
  if (
    !desktopTypedSequenceDisplay ||
    desktopNextLetters.length === 0 ||
    foundWord
  ) {
    return null;
  }

  return (
    <div className="desktop-word-building">
      <WordDisplay
        displayChar={displayChar}
        displayCharClass={displayCharClass}
        fontClass={fontClass}
        animationKey={animationKey}
        foundWord={foundWord}
        wordFadingOut={wordFadingOut}
      />
      {showNextLetters && (
        <div className="desktop-next-letters">
          {desktopNextLetters.map((letter, idx) => (
            <span
              key={`${letter}-${idx}`}
              className="desktop-next-letter"
              onClick={() => onLetterTap(letter.toLowerCase())}
            >
              {letter}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
