import { render, screen } from "@testing-library/react";
import type { User } from "firebase/auth";
import { vi } from "vitest";
import { AuthContext } from "../contexts/AuthContext";
import type { AuthContextType, UserProfile as UserProfileType } from "../types";
import UserProfile from "./UserProfile";

const mockUserProfile: UserProfileType = {
  name: "Test User",
  email: "test@example.com",
  avatar: "https://example.com/avatar.jpg",
  isAdmin: false,
  isStaff: false,
  createdAt: "2023-01-01T00:00:00Z",
  lastLogin: "2023-05-01T00:00:00Z",
  points: 100,
  role: "user",
  progress: [],
};

const mockUser: Partial<User> = {
  uid: "123",
  email: "test@example.com",
  displayName: "Test User",
};

const mockAuthContext: AuthContextType = {
  currentUser: mockUser as User,
  userProfile: mockUserProfile,
  isAdminMode: false,
  login: vi.fn(),
  logout: vi.fn(),
  toggleAdminMode: vi.fn(),
  refreshUserProfile: vi.fn(),
  profileError: null,
  profileLoading: false,
};

describe("UserProfile", () => {
  it("renders user profile information", () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    const loadingContext = { ...mockAuthContext, profileLoading: true };
    render(
      <AuthContext.Provider value={loadingContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("displays error state", () => {
    const errorContext = {
      ...mockAuthContext,
      profileError: "Failed to load profile",
    };
    render(
      <AuthContext.Provider value={errorContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByText("Error: Failed to load profile"),
    ).toBeInTheDocument();
  });

  it("should not call refreshUserProfile on every render", () => {
    const mockRefreshUserProfile = vi.fn();
    const { rerender } = render(
      <AuthContext.Provider
        value={{
          ...mockAuthContext,
          refreshUserProfile: mockRefreshUserProfile,
        }}
      >
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(mockRefreshUserProfile).toHaveBeenCalledTimes(1);

    rerender(
      <AuthContext.Provider
        value={{
          ...mockAuthContext,
          refreshUserProfile: mockRefreshUserProfile,
        }}
      >
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(mockRefreshUserProfile).toHaveBeenCalledTimes(1);
  });

  it("displays admin status for admin users", () => {
    const adminContext = {
      ...mockAuthContext,
      userProfile: { ...mockUserProfile, isAdmin: true },
    };
    render(
      <AuthContext.Provider value={adminContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("displays staff status for staff users", () => {
    const staffContext = {
      ...mockAuthContext,
      userProfile: { ...mockUserProfile, isStaff: true },
    };
    render(
      <AuthContext.Provider value={staffContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Staff")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <UserProfile />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("1/1/2023, 12:00:00 AM")).toBeInTheDocument(); // Created At
    expect(screen.getByText("5/1/2023, 12:00:00 AM")).toBeInTheDocument(); // Last Login
  });
});
