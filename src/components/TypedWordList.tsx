interface TypedWordListProps {
  typedWords: string[];
}

export function TypedWordList({ typedWords }: TypedWordListProps) {
  return (
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
  );
}
