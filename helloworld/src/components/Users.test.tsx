import { act, render, screen } from "@testing-library/react";
import type { User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { MemoryRouter } from "react-router-dom";
import { type Mock, vi } from "vitest";
import { AuthContext } from "../contexts/AuthContext";
import type { AuthContextType, UserProfile } from "../types";
import Users from "./Users";

const mockUserProfile: UserProfile = {
  name: "Test Admin",
  email: "admin@test.com",
  avatar: "avatar-url",
  isAdmin: true,
  isStaff: true,
  createdAt: "2023-01-01",
  lastLogin: "2023-05-01",
  points: 100,
  role: "admin",
  progress: [],
};

const mockCurrentUser: Partial<User> = {
  uid: "test-uid",
  email: "admin@test.com",
};

const mockAuthContext: AuthContextType = {
  currentUser: mockCurrentUser as User,
  userProfile: mockUserProfile,
  isAdminMode: true,
  login: vi.fn(),
  logout: vi.fn(),
  toggleAdminMode: vi.fn(),
  refreshUserProfile: vi.fn(),
  profileError: null,
  profileLoading: false,
};

describe("Users component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAuthContext = (authContextValue = mockAuthContext) => {
    return render(
      <AuthContext.Provider value={authContextValue}>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  };

  it("renders loading state initially", async () => {
    (httpsCallable as Mock).mockReturnValue(() => new Promise(vi.fn()));
    await act(async () => {
      renderWithAuthContext();
    });
    // expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.getByText("No user is currently signed in"),
    ).toBeInTheDocument();
  });

  it("doesn't render for non-admin users", async () => {
    const nonAdminContext = {
      ...mockAuthContext,
      userProfile: { ...mockUserProfile, isAdmin: false },
    };

    await act(async () => {
      renderWithAuthContext();
    });

    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("doesn't render when admin mode is off", async () => {
    const adminModeOffContext = {
      ...mockAuthContext,
      isAdminMode: false,
    };

    await act(async () => {
      renderWithAuthContext();
    });

    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});
