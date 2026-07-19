export type Difficulty = 'easy' | 'medium' | 'hard';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  points: number;
  earningsPesos: number; // derived (points/10) but kept for convenience
  gamesPlayed: number;
  bestWpm: number;
  accuracy: number; // 0-100
  joinDateMs: number;
};

export type GameResult = {
  gameId: string;
  uid: string;
  finishedAtMs: number;
  durationSec: number;
  totalTyped: number;
  correctTyped: number;
  accuracy: number;
  wpm: number;
  pointsEarned: number;
  difficulty: Difficulty;
};

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export type WithdrawalRequest = {
  withdrawalId: string;
  uid: string;
  fullName: string;
  gcashNumber: string;
  pointsAtRequest: number;
  amountPesos: number;
  status: WithdrawalStatus;
  createdAtMs: number;
  updatedAtMs: number;
};

