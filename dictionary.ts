export const DICTIONARY = {
  easy: [
    'cat', 'daniel amores', 'dog', 'sun', 'tree', 'book', 'milk', 'house', 'bird', 'fish', 'moon',
    'green', 'happy', 'cool', 'small', 'big', 'light', 'water', 'chair', 'table', 'road',
  ],
  medium: [
    'planet', 'garden', 'camera', 'notebook', 'triangle', 'yellow', 'football', 'butter',
    'magnetic', 'computer', 'rainbow', 'language', 'umbrella', 'backpack', 'mountain',
  ],
  hard: [
    'extraordinary', 'international', 'characterization', 'miscommunication',
    'electromagnetic', 'congratulations', 'intercontinental', 'institutional',
    'indistinguishable', 'responsibilities',
  ],
} as const;

export type Difficulty = keyof typeof DICTIONARY;

export function getRandomWord(difficulty: Difficulty): string {
  const list = DICTIONARY[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}

