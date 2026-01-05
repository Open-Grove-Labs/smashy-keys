export const getCharColor = (char: string): string => {
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

  if (char >= "a" && char <= "z") {
    return colors[10 + (char.charCodeAt(0) - "a".charCodeAt(0))];
  }

  if (char >= "A" && char <= "Z") {
    return colors[10 + (char.charCodeAt(0) - "A".charCodeAt(0))];
  }

  return "#ffffff";
};

export const getRandomBackgroundColor = (): string => {
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

export const getRandomDarkColor = (): string => {
  const darkColors = [
    "#ff6b6b", // red
    "#4ecdc4", // teal
    "#45b7d1", // blue
    "#5f27cd", // purple
    "#f0932b", // orange
    "#eb4d4b", // dark red
    "#6c5ce7", // violet
    "#e17055", // coral
    "#0984e3", // bright blue
    "#00b894", // green
    "#e84393", // pink
    "#d63031", // deep red
    "#0984e3", // ocean blue
    "#6c5ce7", // indigo
  ];
  return darkColors[Math.floor(Math.random() * darkColors.length)];
};
