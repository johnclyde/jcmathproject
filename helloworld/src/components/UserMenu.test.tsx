import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import type React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import type { UserProfile } from "../types";
import UserMenu from "./UserMenu";

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  GoogleLogin: () => <button type="submit">Mock Google Login</button>,
}));

const mockUser: Partial<User> = {
  displayName: "Test User",
  email: "test@example.com",
  photoURL: "avatar-url",
};

const mockUserProfile: UserProfile = {
  name: "Test User",
  email: "test@example.com",
  avatar: "avatar-url",
  isAdmin: true,
  isStaff: false,
  createdAt: "2023-01-01",
  lastLogin: "2023-05-01",
  points: 100,
  role: "Admin",
  progress: [],
};

const defaultProps = {
  user: null,
  userProfile: null,
  showUserMenu: false,
  setShowUserMenu: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  isAdminMode: false,
  toggleAdminMode: vi.fn(),
};

const renderUserMenu = (props = {}) => {
  return render(
    <BrowserRouter>
      <UserMenu {...defaultProps} {...props} />
    </BrowserRouter>,
  );
};

describe("UserMenu", () => {
  it("renders login button when not logged in", async () => {
    renderUserMenu({ showUserMenu: true });
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders user menu when logged in", async () => {
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      showUserMenu: true,
    });
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("does not render Users button for non-admin users", async () => {
    renderUserMenu({
      user: mockUser,
      userProfile: { ...mockUserProfile, isAdmin: false },
      showUserMenu: true,
    });
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("does not render Users button for admin users when admin mode is off", async () => {
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      showUserMenu: true,
      isAdminMode: false,
    });
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("renders Users button for admin users when admin mode is on", async () => {
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      showUserMenu: true,
      isAdminMode: true,
    });
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders admin mode toggle for admin users", async () => {
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      showUserMenu: true,
    });
    expect(screen.getByText("Enable Admin Mode")).toBeInTheDocument();
  });

  it("toggles admin mode when clicking the toggle button", async () => {
    const toggleAdminMode = vi.fn();
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      toggleAdminMode,
      isAdminMode: false,
      showUserMenu: true,
    });
    fireEvent.click(screen.getByText("Enable Admin Mode"));
    expect(toggleAdminMode).toHaveBeenCalled();
  });

  it("opens login dialog when login button is clicked", async () => {
    renderUserMenu({ user: null, userProfile: null, showUserMenu: true });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByText("Mock Google Login")).toBeInTheDocument();
    });
  });

  it("closes login dialog when cancel button is clicked", async () => {
    renderUserMenu({ user: null, userProfile: null, showUserMenu: true });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => {
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });
  });

  it("calls logout function when clicking logout", async () => {
    const logout = vi.fn();
    renderUserMenu({
      user: mockUser,
      userProfile: mockUserProfile,
      logout,
      showUserMenu: true,
    });
    fireEvent.click(screen.getByText("Logout"));
    expect(logout).toHaveBeenCalled();
  });
});
