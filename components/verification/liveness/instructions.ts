/**
 * Full pool of liveness instructions.
 * Three are picked randomly each session so repeat attempts stay unpredictable.
 */
export const INSTRUCTION_POOL: readonly string[] = [
  "Look over your left shoulder",
  "Nod slowly",
  "Hold up 2 fingers",
  "Blink three times slowly",
  "Turn your head to the right",
  "Give a thumbs up",
  "Open and close your mouth twice",
  "Look up at the ceiling",
  "Cover one eye with your hand",
  "Smile widely",
  "Shake your head gently",
  "Point directly at the camera",
];

/** Returns `count` instructions in a randomised order. */
export function pickInstructions(count = 3): string[] {
  return [...INSTRUCTION_POOL].sort(() => Math.random() - 0.5).slice(0, count);
}
