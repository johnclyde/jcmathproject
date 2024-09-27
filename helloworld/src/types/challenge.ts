import type { Action, Exam, ProblemReference } from "./exam";

export type ChallengeType =
  | "firstTen"
  | "full"
  | "11-15"
  | "16-20"
  | "21-25"
  | "redemption";

export interface ChallengeData {
  id: string;
  name: string;
  type: ChallengeType;
  examType: Exam["examType"];
  problems: ProblemReference[];
  createdAt: string;
  examIds?: string[];
  comment?: string;
}

export interface ProblemResponse {
  actions: Action[];
  finalAnswer: string | null;
  isCorrect?: boolean;
  totalTimeSpent: number;
}

export interface ChallengeRun {
  id: string;
  challenge: ChallengeData;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  responses: Record<string, ProblemResponse>;
  actions: Action[];
}

export interface TimestampedResponse {
  answer: string;
  timestamp: number;
}

export interface ProblemTimer {
  firstTimer: number;
  secondTimer: number;
  firstTimerLocked: boolean;
}
