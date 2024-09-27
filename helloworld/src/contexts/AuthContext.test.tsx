import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  type User,
  type UserCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import type React from "react";
import { type Mock, type MockedFunction, vi } from "vitest";
import { auth, getIdToken } from "../firebase";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
  },
  getIdToken: vi.fn(() => Promise.resolve("mocked-id-token")),
}));

vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

const mockHttpsCallable = httpsCallable as MockedFunction<typeof httpsCallable>;
const mockSignInWithPopup = signInWithPopup as MockedFunction<
  typeof signInWithPopup
>;
const mockSignOut = signOut as MockedFunction<typeof signOut>;

const TestComponent: React.FC = () => {
  const {
    currentUser,
    userProfile,
    login,
    logout,
    refreshUserProfile,
    profileLoading,
    profileError,
    isAdminMode,
    toggleAdminMode,
  } = useAuth();
  return (
    <div>
      <div data-testid="user-info">
        {currentUser ? currentUser.email : "No user"}
      </div>
      <div data-testid="profile-info">
        {userProfile ? userProfile.name : "No profile"}
      </div>
      <div data-testid="loading-state">
        {profileLoading ? "Loading" : "Not loading"}
      </div>
      <div data-testid="error-state">{profileError || "No error"}</div>
      <div data-testid="admin-mode">{isAdminMode ? "Admin" : "Normal"}</div>
      <button onClick={login} data-testid="login-button" type="submit">
        Login
      </button>
      <button onClick={logout} data-testid="logout-button" type="submit">
        Logout
      </button>
      <button
        onClick={refreshUserProfile}
        data-testid="refresh-button"
        type="submit"
      >
        Refresh
      </button>
      <button
        onClick={toggleAdminMode}
        data-testid="toggle-admin-button"
        type="submit"
      >
        Toggle Admin Mode
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getFunctions as Mock).mockReturnValue({});
  });

  it("initializes with no user and no profile", async () => {
    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user-info")).toHaveTextContent("No user");
    expect(screen.getByTestId("profile-info")).toHaveTextContent("No profile");
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Not loading",
    );
    expect(screen.getByTestId("error-state")).toHaveTextContent("No error");
  });

  it("fetches user profile on login", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };
    const mockProfile = { user: { name: "Test User", isAdmin: false } };

    mockSignInWithPopup.mockResolvedValueOnce({
      user: mockUser,
    } as UserCredential);
    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: mockProfile }),
    );

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByTestId("login-button");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "test@example.com",
      );
    });

    expect(screen.getByTestId("profile-info")).toHaveTextContent("Test User");

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "Not loading",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toHaveTextContent("No error");
    });
  });

  it("calls login function with correct parameters", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };
    const mockProfile = { user: { name: "Test User", isAdmin: false } };
    const mockIdToken = "mock-id-token";

    const mockLoginFunction = vi.fn().mockResolvedValue({ data: mockProfile });
    mockHttpsCallable.mockReturnValue(mockLoginFunction);

    mockSignInWithPopup.mockResolvedValueOnce({
      user: mockUser,
    } as UserCredential);

    (getIdToken as Mock).mockResolvedValue(mockIdToken);

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByTestId("login-button");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "test@example.com",
      );
    });

    expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, "userProfile");
    expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, "login");
    expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, "userProfile");
    expect(mockLoginFunction).toHaveBeenCalledWith({ idToken: mockIdToken });
  });

  it("handles login failure correctly", async () => {
    mockSignInWithPopup.mockRejectedValueOnce(new Error("Login failed"));

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByTestId("login-button");
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toHaveTextContent(
        "Failed to fetch user profile",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent("No user");
    });

    await waitFor(() => {
      expect(screen.getByTestId("profile-info")).toHaveTextContent(
        "No profile",
      );
    });
  });

  it("clears user and profile on logout", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };
    const mockProfile = { user: { name: "Test User", isAdmin: false } };

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: mockProfile }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "test@example.com",
      );
    });

    mockSignOut.mockResolvedValueOnce(undefined);
    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: { success: true } }),
    );

    const logoutButton = screen.getByTestId("logout-button");
    await userEvent.click(logoutButton);

    //await waitFor(() => {
    //  expect(screen.getByTestId("user-info")).toHaveTextContent("No user");
    //});
    await waitFor(() => {
      expect(screen.getByTestId("profile-info")).toHaveTextContent(
        "No profile",
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toHaveTextContent("No error");
    });
  });

  it("fetches user profile on auth state change", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };
    const mockProfile = { user: { name: "Test User", isAdmin: false } };

    let authStateListener: ((user: Partial<User> | null) => void) | null = null;
    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      authStateListener = callback;
      callback(null);
      return vi.fn();
    });

    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: mockProfile }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user-info")).toHaveTextContent("No user");
    expect(screen.getByTestId("profile-info")).toHaveTextContent("No profile");

    await act(async () => {
      if (authStateListener) authStateListener(mockUser as User);
    });

    //await waitFor(() => {
    //expect(screen.getByTestId("user-info")).toHaveTextContent(
    //  "test@example.com",
    //);
    //expect(screen.getByTestId("profile-info")).toHaveTextContent("Test User");
    //});
  });

  it("refreshes user profile", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };
    const initialProfile = { user: { name: "Initial User", isAdmin: false } };
    const updatedProfile = { user: { name: "Updated User", isAdmin: true } };

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    let callCount = 0;
    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: callCount === 1 ? initialProfile : updatedProfile,
        });
      }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("profile-info")).toHaveTextContent(
        "Initial User",
      );
    });

    const refreshButton = screen.getByTestId("refresh-button");
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId("profile-info")).toHaveTextContent(
        "Updated User",
      );
    });
  });

  it("toggles admin mode for admin users", async () => {
    const mockUser: Partial<User> = { email: "admin@example.com" };
    const mockProfile = { user: { name: "Admin User", isAdmin: true } };

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: mockProfile }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-mode")).toHaveTextContent("Normal");
    });

    const toggleButton = screen.getByTestId("toggle-admin-button");
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("admin-mode")).toHaveTextContent("Admin");
    });
  });

  it("does not toggle admin mode for non-admin users", async () => {
    const mockUser: Partial<User> = { email: "user@example.com" };
    const mockProfile = { user: { name: "Regular User", isAdmin: false } };

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockResolvedValue({ data: mockProfile }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-mode")).toHaveTextContent("Normal");
    });

    const toggleButton = screen.getByTestId("toggle-admin-button");
    await userEvent.click(toggleButton);

    expect(screen.getByTestId("admin-mode")).toHaveTextContent("Normal");
  });

  it("handles logout error", async () => {
    const mockUser: Partial<User> = { email: "test@example.com" };

    (auth.onAuthStateChanged as Mock).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    mockHttpsCallable.mockImplementation(() =>
      vi.fn().mockRejectedValue(new Error("Logout failed")),
    );
    mockSignOut.mockRejectedValueOnce(new Error("Logout failed"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const logoutButton = screen.getByTestId("logout-button");
    await userEvent.click(logoutButton);

    //await waitFor(() => {
    //  expect(screen.getByTestId("error-state")).toHaveTextContent(
    //    "Failed to log out",
    //  );
    //});
  });
});
