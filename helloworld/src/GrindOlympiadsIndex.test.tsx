import { render, screen } from "@testing-library/react";
import type { User } from "firebase/auth";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import GrindOlympiadsIndex from "./GrindOlympiadsIndex";
import { AuthContext } from "./contexts/AuthContext";
import type { UserProfile } from "./types";

// Mock the useTests hook
vi.mock("./hooks/useTests", () => ({
  __esModule: true,
  default: () => ({
    tests: [],
    loading: false,
    error: null,
    searchTerm: "",
    setSearchTerm: vi.fn(),
    selectedCompetition: "",
    setSelectedCompetition: vi.fn(),
    filteredTests: [],
  }),
}));

// Mock the Hero component
vi.mock("./components/Hero", () => ({
  __esModule: true,
  default: () => <div data-testid="hero">Hero Component</div>,
}));

// Mock the UserProgress component
vi.mock("./components/UserProgress", () => ({
  __esModule: true,
  default: () => <div data-testid="user-progress">User Progress Component</div>,
}));

describe("GrindOlympiadsIndex", () => {
  const mockUser: Partial<User> = {
    displayName: "John Doe",
    email: "john@example.com",
  };

  const renderWithAuthContext = (
    currentUser: Partial<User> | null = null,
    userProfile: Partial<UserProfile> | null | null = null,
  ) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            currentUser: currentUser as User | null,
            userProfile: userProfile as UserProfile | null,
            isAdminMode: false,
            login: vi.fn(),
            logout: vi.fn(),
            toggleAdminMode: vi.fn(),
            refreshUserProfile: vi.fn(),
            profileError: null,
            profileLoading: false,
          }}
        >
          <GrindOlympiadsIndex />
        </AuthContext.Provider>
      </BrowserRouter>,
    );
  };

  it("displays LoggedOutPage when user is not logged in", () => {
    renderWithAuthContext(null, null);
    expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
  });

  it("displays welcome message with user profile name when available", () => {
    renderWithAuthContext(mockUser, { name: "Jane Doe" });
    expect(screen.getByText("Welcome, Jane Doe!")).toBeInTheDocument();
  });

  it("displays welcome message with Firebase displayName when profile name is not available", () => {
    renderWithAuthContext(mockUser, {});
    expect(screen.getByText("Welcome, John Doe!")).toBeInTheDocument();
  });

  it("displays welcome message with Firebase email when displayName is not available", () => {
    renderWithAuthContext({ ...mockUser, displayName: null }, {});
    expect(screen.getByText("Welcome, john@example.com!")).toBeInTheDocument();
  });

  it('displays welcome message with "User" when no user information is available', () => {
    renderWithAuthContext({ displayName: null, email: null }, {});
    expect(screen.getByText("Welcome, User!")).toBeInTheDocument();
  });

  it("renders Hero component", () => {
    renderWithAuthContext(mockUser, {});
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("renders UserProgress component", () => {
    renderWithAuthContext(mockUser, {});
    expect(screen.getByTestId("user-progress")).toBeInTheDocument();
  });
});
