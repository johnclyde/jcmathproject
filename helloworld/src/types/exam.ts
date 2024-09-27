export interface ImageData {
  alt: string;
  height: number;
  url: string;
  width: number;
}

export interface BaseProblemDetails {
  statement: string;
  image?: ImageData;
  diagrams?: string[];
}

export interface AMCProblemDetails extends BaseProblemDetails {
  type: "multiple_choice";
  options: Record<string, string>;
  correctAnswer: string;
}

export interface AIMEProblemDetails extends BaseProblemDetails {
  type: "short_answer";
  options: Record<string, string>;
  correctAnswer: string;
}

export interface OlympiadProblemDetails extends BaseProblemDetails {
  type: "essay";
  options: Record<string, string>;
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

export interface Exam {
  id: string;
  title: string;
  competition: string;
  year: string;
  name: string;
  examType:
    | "AMC-8"
    | "AMC-10"
    | "AMC-12"
    | "AIME"
    | "ARML"
    | "Olympiad"
    | "MATHCOUNTS"
    | "other";
  problems: Array<{
    problemId: string;
    label: string;
    statement: string;
    type: "multiple_choice" | "short_answer" | "essay";
  }>;
  comment?: string;
}

export interface ExamUpdateData {
  examId: string;
  examType: Exam["examType"];
  problemsToConvert?: string[];
}

export type ActionType =
  | "createChallengeRun"
  | "guessAnswer"
  | "loadSavedState"
  | "navigateAway"
  | "openProblem"
  | "openTest"
  | "skipProblem"
  | "submitAnswer"
  | "viewAllProblems"
  | "viewSingleProblem";

export interface Action {
  type: ActionType;
  timestamp: string;
  challengeRunId?: string;
  problemLabel?: string;
  userId?: string;
  userName?: string;
  data?: Record<string, unknown>;
}

export type ProblemStatus =
  | "unattempted"
  | "answered"
  | "confirmed"
  | "skipped"
  | "guessed"
  | "conflicting";

export interface ProblemReference {
  examId: string;
  problemId: string;
  label: string;
}
