/**
 * Determines the character to display based on keyboard event
 */
export function getDisplayCharFromKey(event: KeyboardEvent): string {
  const key = event.key;

  // Handle letters and numbers
  if (/^[a-zA-Z0-9]$/.test(key)) {
    // For letters, use the actual case based on Caps Lock and Shift
    if (/^[a-zA-Z]$/.test(key)) {
      // Check if Caps Lock is on
      const capsLockOn = event.getModifierState("CapsLock");
      const shiftPressed = event.shiftKey;

      // Determine if letter should be uppercase
      const shouldBeUppercase = capsLockOn !== shiftPressed; // XOR logic

      return shouldBeUppercase ? key.toUpperCase() : key.toLowerCase();
    } else {
      // For numbers, always show as-is
      return key;
    }
  }
  // Handle arrow keys
  else if (key === "ArrowUp") {
    return "UP";
  } else if (key === "ArrowDown") {
    return "DOWN";
  } else if (key === "ArrowLeft") {
    return "LEFT";
  } else if (key === "ArrowRight") {
    return "RIGHT";
  }

  return "";
}
