import squirrelImg from "../assets/animals/squirrel.webp";
import bearImg from "../assets/animals/bear.webp";
import duckImg from "../assets/animals/duck.webp";
import fishImg from "../assets/animals/fish.webp";
import horseImg from "../assets/animals/horse.webp";
import type { SpawnEntry } from "../hooks/useSpawner";

interface CritterLayerProps {
  leftShiftPressed: boolean;
  rightShiftPressed: boolean;
  bearVisible: boolean;
  duckVisible: boolean;
  fishList: SpawnEntry[];
  horseList: SpawnEntry[];
  removeFish: (id: number) => void;
  removeHorse: (id: number) => void;
}

export function CritterLayer({
  leftShiftPressed,
  rightShiftPressed,
  bearVisible,
  duckVisible,
  fishList,
  horseList,
  removeFish,
  removeHorse,
}: CritterLayerProps) {
  return (
    <>
      <img
        src={squirrelImg}
        alt="Squirrel"
        className={`squirrel squirrel-left ${leftShiftPressed ? "squirrel-peek" : ""}`}
      />

      <img
        src={squirrelImg}
        alt="Squirrel"
        className={`squirrel squirrel-right ${rightShiftPressed ? "squirrel-peek" : ""}`}
      />

      <img src={bearImg} alt="Bear" className={`bear ${bearVisible ? "bear-pop" : ""}`} />

      <img src={duckImg} alt="Duck" className={`duck ${duckVisible ? "duck-pop" : ""}`} />

      {fishList.map((f) => (
        <img
          key={f.id}
          src={fishImg}
          alt="Fish"
          className={`fish fish-id-${f.id} ${f.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"}`}
          onAnimationEnd={() => removeFish(f.id)}
        />
      ))}

      {horseList.map((h) => (
        <img
          key={`horse-${h.id}`}
          src={horseImg}
          alt="Horse"
          className={`horse horse-id-${h.id} ${h.dir === "ltr" ? "fish-swim" : "fish-swim-rtl"}`}
          onAnimationEnd={() => removeHorse(h.id)}
        />
      ))}
    </>
  );
}
