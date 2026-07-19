import type { Difficulty } from '../types';

export const POINTS_PER_WORD = 1;
export const POINTS_TO_PESOS = 10;

// Gameplay rules (client-side):
// - 60 seconds duration
// - For each round, user types a word before time runs out.
// - Correct word => +1 point
// - Incorrect => 0 points
// - Accuracy = correctTyped / totalTyped * 100
// - WPM: typical typing metric. We'll use: wpm = (correctTyped / durationMin) * (avgChars/5)
//   Simplification: treat each word as 5 chars.

const AVG_CHARS_PER_WORD = 5;

export function calcAccuracy(correctTyped: number, totalTyped: number) {
  if (totalTyped <= 0) return 0;
  return (correctTyped / totalTyped) * 100;
}

export function calcWpm(correctTyped: number, durationSec: number) {
  const durationMin = durationSec / 60;
  if (durationMin <= 0) return 0;
  const chars = correctTyped * AVG_CHARS_PER_WORD;
  return chars / 5 / durationMin;
}

export function calcEstimatedEarningsPesos(points: number) {
  return Math.floor(points / POINTS_TO_PESOS);
}

export function difficultyToWordSpeedMs(difficulty: Difficulty) {
  // How long each word is on screen (word timer).
  // MVP uses sequential word deadlines; can be improved later.
  switch (difficulty) {
    case 'easy':
      return 3500;
    case 'medium':
      return 3000;
    case 'hard':
      return 2500;
    default:
      return 3000;
  }
}

