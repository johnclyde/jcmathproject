import type { User } from "firebase/auth";

export interface UserProgress {
  testId: string;
  score: number;
  completedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  isStaff: boolean;
  createdAt: string;
  lastLogin: string;
  points: number;
  role: string;
  progress: UserProgress[];
  testsTaken?: string[];
  achievements?: string[];
}

export type LoginFunction = () => Promise<void>;

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdminMode: boolean;
  login: LoginFunction;
  logout: () => Promise<void>;
  toggleAdminMode: () => void;
  refreshUserProfile: () => Promise<void>;
  profileError: string | null;
  profileLoading: boolean;
}
