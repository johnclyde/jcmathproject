import {
  GoogleAuthProvider,
  type User,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, getIdToken } from "../firebase";
import type {
  AuthContextType,
  AuthProviderProps,
  LoginFunction,
  UserProfile,
} from "../types";

const functions = getFunctions();
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return (
      sessionStorage.getItem("isAdminMode") === "true" && userProfile?.isAdmin
    );
  });
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("isAdminMode", (!!isAdminMode).toString());
  }, [isAdminMode]);

  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return;

    setProfileLoading(true);
    try {
      const idToken = await getIdToken();
      const userProfileFunction = httpsCallable(functions, "userProfile");
      const result = await userProfileFunction({ idToken });
      setUserProfile(
        (prevProfile) => (result.data as { user: UserProfile }).user,
      );
      setProfileError(null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError("Failed to fetch user profile");
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser((prevUser) => user);
      if (user) {
        fetchUserProfile().catch((error) => {
          console.error("Error fetching user profile:", error);
          setProfileError("Failed to fetch user profile");
          setUserProfile(null);
        });
      } else {
        setUserProfile(null);
        setProfileError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
      await fetchUserProfile();
    }
  }, [currentUser, fetchUserProfile]);

  const login: LoginFunction = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      if (result.user) {
        setCurrentUser((prevUser) => result.user);
        const idToken = await getIdToken();
        const loginFunction = httpsCallable(functions, "login");
        await loginFunction({ idToken });
        await fetchUserProfile();
      }
    } catch (error) {
      console.error("Failed to log in:", error);
      setProfileError("Failed to fetch user profile");
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const idToken = await getIdToken();
      const logoutFunction = httpsCallable(functions, "logout");
      await logoutFunction({ idToken });
      await signOut(auth);
      setProfileError(null);
    } catch (error) {
      console.error("Failed to log out:", error);
      setProfileError("Failed to log out");
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdminMode(false);
  };

  const toggleAdminMode = () => {
    if (userProfile?.isAdmin) {
      setIsAdminMode((prevMode) => !prevMode);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isAdminMode,
    login,
    logout,
    toggleAdminMode,
    refreshUserProfile,
    profileError,
    profileLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
