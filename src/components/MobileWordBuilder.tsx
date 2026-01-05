import React from "react";

interface MobileWordBuilderProps {
  mobileTypedSequence: string;
  availableLetters: string[];
  showNextLetters: boolean;
  isLandscape: boolean;
  onLetterTap: (letter: string, event?: React.MouseEvent | React.TouchEvent) => void;
}

export function MobileWordBuilder({
  mobileTypedSequence,
  availableLetters,
  showNextLetters,
  isLandscape,
  onLetterTap,
}: MobileWordBuilderProps) {
  if (availableLetters.length === 0) return null;

  return (
    <div className={`mobile-word-building ${isLandscape ? "landscape" : ""}`}>
      {mobileTypedSequence && (
        <div className={`mobile-sequence ${isLandscape ? "landscape" : ""}`}>
          {mobileTypedSequence.toUpperCase()}
        </div>
      )}

      {showNextLetters && (
        <div className={`mobile-letter-display ${isLandscape ? "landscape" : ""}`}>
          {availableLetters.map((letter, idx) => (
            <div
              key={`${letter}-${idx}`}
              className="mobile-letter"
              onClick={(e) => onLetterTap(letter, e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                onLetterTap(letter, e);
              }}
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
