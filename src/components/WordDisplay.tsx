interface WordDisplayProps {
  displayChar: string;
  displayCharClass: string;
  fontClass: string;
  animationKey: number;
  foundWord: string;
  wordFadingOut: boolean;
}

export function WordDisplay({
  displayChar,
  displayCharClass,
  fontClass,
  animationKey,
  foundWord,
  wordFadingOut,
}: WordDisplayProps) {
  return (
    <div className="display-container">
      <div key={animationKey} className={`display-char ${displayCharClass} ${fontClass}`}>
        {displayChar}
      </div>
      {foundWord && (
        <div className={`found-word ${wordFadingOut ? "fading-out" : ""}`}>{foundWord}</div>
      )}
    </div>
  );
}
