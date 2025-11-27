export const randomFishTop = () => {
  const y = Math.floor(Math.random() * (80 - 20 + 1)) + 20; // 20..80
  return `${y}%`;
};

export const randomFishDuration = () => {
  const minDur = 2.0;
  const maxDur = 4.5;
  return Number((Math.random() * (maxDur - minDur) + minDur).toFixed(2));
};
