import type { User } from "firebase/auth";
import type { ReactNode } from "react";
import type {
  ChallengeRun,
  ProblemTimer,
  TimestampedResponse,
} from "./challenge";
import type {
  Exam,
  ProblemDetails,
  ProblemReference,
  ProblemStatus,
} from "./exam";
import type { NotificationType } from "./notification";
import type { LoginFunction, UserProfile } from "./user";

export interface AuthProviderProps {
  children: ReactNode;
}

export interface ChallengeStatusPageProps {
  problemResponses: Record<string, TimestampedResponse[]>;
  problems: ProblemReference[];
  onContinue: () => void;
  onFinish: () => void;
  isChallenge: boolean;
}

export interface ExamContentProps {
  exam: Exam;
  challengeRun: ChallengeRun;
  challengeProblems: ProblemReference[];
  onFinish: () => void;
}

export interface ExamEditorProps {
  exam: Exam;
}

export interface HeaderProps {
  notifications: NotificationType[];
  notificationsError: string | null;
  markNotificationAsRead: (id: string) => void;
  NotificationBell: React.ForwardRefExoticComponent<
    NotificationBellProps & React.RefAttributes<HTMLDivElement>
  >;
  UserMenu: React.ForwardRefExoticComponent<
    UserMenuProps & React.RefAttributes<HTMLDivElement>
  >;
  stagingLogin?: () => void;
}

export interface MultipleChoiceProblemViewProps {
  problem: ProblemDetails & { problemId: string; label: string };
  examId: string;
  onOptionSelect: (answer: string) => void;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  autoSubmit: boolean;
  selectedAnswer: string | null;
  responses: TimestampedResponse[];
}

export interface NotificationBellProps
  extends React.ComponentPropsWithoutRef<"div"> {
  notifications: NotificationType[];
  notificationsError: string | null;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  markNotificationAsRead: (id: string) => void;
}

export interface ProblemEditorProps {
  problem: ProblemDetails;
  problemLabel: string;
  onSave: (updatedProblem: ProblemDetails) => void;
  onCancel: () => void;
}

export interface ProblemListProps {
  problems: (Partial<ProblemReference> & Partial<ProblemDetails>)[];
  setProblems: React.Dispatch<
    React.SetStateAction<Partial<ProblemReference>[]>
  >;
  handleSaveProblem: (
    problemId: string,
    updatedProblem: ProblemDetails,
  ) => Promise<void>;
  handleLabelProblem: (problemId: string, label: string) => Promise<void>;
  syncStatus: Record<string, boolean>;
}

export interface ProblemNavigationProps {
  problems: ProblemReference[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  responses: Record<string, TimestampedResponse[]>;
  problemTimers: Record<string, ProblemTimer>;
  totalTimePaused: number;
  visitedProblems: boolean[];
}

export interface ProblemViewProps {
  problem: ProblemDetails & { problemId: string; label: string };
  examId: string;
  onAnswerSubmit: (answer: string) => void;
  onSkip: () => void;
  currentAnswer: string;
}

export interface TrainingModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onTakeExam: () => void;
  onStartChallenge: (type: string) => Promise<void>;
  onViewPhilosophy: () => void;
}

export interface UserMenuProps extends React.ComponentPropsWithoutRef<"div"> {
  user: User | null;
  userProfile: UserProfile | null;
  showUserMenu: boolean;
  setShowUserMenu: React.Dispatch<React.SetStateAction<boolean>>;
  login: LoginFunction;
  logout: () => void;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  stagingLogin?: () => void;
}
