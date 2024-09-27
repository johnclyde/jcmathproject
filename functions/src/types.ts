export type ActionType =
  | "createChallengeRun"
  | "openTest"
  | "openProblem"
  | "guessAnswer"
  | "submitAnswer"
  | "skipProblem"
  | "navigateAway";

export type ExamType =
  | "AMC-8"
  | "AMC-10"
  | "AMC-12"
  | "AIME"
  | "ARML"
  | "Olympiad"
  | "MATHCOUNTS"
  | "other";

export interface BaseProblemDetails {
  statement: string;
  image?: string;
  diagrams?: string[];
  type: "multiple_choice" | "short_answer" | "essay";
}

export interface AMCProblemDetails extends BaseProblemDetails {
  type: "multiple_choice";
  options: Record<string, string>;
  correctAnswer: string;
}

export interface AIMEProblemDetails extends BaseProblemDetails {
  type: "short_answer";
  correctAnswer: string;
}

export interface OlympiadProblemDetails extends BaseProblemDetails {
  type: "essay";
  solutionGuidelines?: string;
}

export type ProblemDetails =
  | AMCProblemDetails
  | AIMEProblemDetails
  | OlympiadProblemDetails;

export const isAMCProblem = (
  problem: ProblemDetails,
): problem is AMCProblemDetails => problem.type === "multiple_choice";

export const isAIMEProblem = (
  problem: ProblemDetails,
): problem is AIMEProblemDetails => problem.type === "short_answer";

export const isOlympiadProblem = (
  problem: ProblemDetails,
): problem is OlympiadProblemDetails => problem.type === "essay";

export type ChallengeType =
  | "firstTen"
  | "full"
  | "11-15"
  | "16-20"
  | "21-25"
  | "redemption";

export interface UpdateProblemData {
  examId: string;
  problemId: string;
  updatedProblem: ProblemDetails;
}

export interface ProblemReference {
  examId: string;
  problemId: string;
  label: string;
}

export interface ProblemDocument {
  details: ProblemDetails;
  examRefs: {
    [examId: string]: string;
  };
}

export interface ChallengeData {
  id: string;
  name: string;
  type: ChallengeType;
  examType: ExamType;
  problems: ProblemReference[];
  createdAt: string;
  examIds?: string[];
  comment?: string;
}

export interface CreateChallengeData {
  name: string;
  type: ChallengeType;
  examType: ExamType;
}

export interface UpdateChallengeData {
  challengeId: string;
  name?: string;
  type?: ChallengeType;
  examType?: ExamType;
  comment?: string;
  problemsToConvert?: string[];
}

export interface ExamData {
  id: string;
  name: string;
  competition: string;
  year: string;
  examType: ExamType;
  problems: ProblemReference[];
  comment?: string;
}

export interface CreateExamData {
  name: string;
  competition: string;
  year: string;
  examType: ExamType;
}

export interface UpdateExamData {
  examId: string;
  name?: string;
  competition?: string;
  year?: string;
  examType?: ExamType;
  comment?: string;
  problemsToConvert?: string[];
}

export interface Action {
  type: ActionType;
  timestamp: string;
  challengeRunId?: string;
  problemLabel?: string;
  userId?: string;
  data?: Record<string, unknown>;
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
  responses: {
    [label: string]: ProblemResponse;
  };
  actions: Action[];
}

export interface ChallengeResult {
  id: string;
  challengeRunId: string;
  userId: string;
  score: number;
  totalTime: number;
  completedAt: string;
  problemResults: {
    [label: string]: {
      isCorrect: boolean;
      timeSpent: number;
      actionCount: {
        [K in ActionType]?: number;
      };
    };
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  createdAt: string;
  lastLogin: string;
  points: number;
}
