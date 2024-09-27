import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../contexts/AuthContext";
import type {
  AuthContextType,
  HeaderProps,
  NotificationBellProps,
  UserMenuProps,
} from "../types";
import Header from "./Header";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const MockNotificationBell = React.forwardRef<
  HTMLDivElement,
  NotificationBellProps
>(({ setShowNotifications, showNotifications }, ref) => (
  <div ref={ref}>
    <button
      onClick={() => setShowNotifications(!showNotifications)}
      type="submit"
    >
      NotificationBell
    </button>
    {showNotifications && (
      <div data-testid="notification-dropdown">Notification Content</div>
    )}
  </div>
));

MockNotificationBell.displayName = "MockNotificationBell";

const MockUserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  ({ setShowUserMenu, showUserMenu }, ref) => (
    <div ref={ref}>
      <button onClick={() => setShowUserMenu(!showUserMenu)} type="submit">
        User Icon
      </button>
      {showUserMenu && (
        <div data-testid="user-menu-dropdown">
          <button type="submit">Profile</button>
          <button type="submit">Users</button>
          <button type="submit">Settings</button>
          <button type="submit">Logout</button>
        </div>
      )}
    </div>
  ),
);

MockUserMenu.displayName = "MockUserMenu";

const defaultProps: HeaderProps = {
  notifications: [],
  notificationsError: null,
  markNotificationAsRead: vi.fn(),
  NotificationBell: MockNotificationBell,
  UserMenu: MockUserMenu,
};

const mockUser: User = {
  uid: "123",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: "2023-01-01T00:00:00Z",
    lastSignInTime: "2023-01-01T00:00:00Z",
  },
  providerData: [],
  refreshToken: "",
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: "firebase",
};

const mockAuthContext: AuthContextType = {
  currentUser: null,
  userProfile: null,
  isAdminMode: false,
  login: vi.fn(),
  logout: vi.fn(),
  toggleAdminMode: vi.fn(),
  refreshUserProfile: vi.fn(),
  profileError: null,
  profileLoading: false,
};

const renderHeader = (props = {}, authContextValue = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter>
        <Header {...defaultProps} {...props} />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

describe("Header", () => {
  it("renders GrindOlympiads link", () => {
    renderHeader();
    expect(screen.getByText("GrindOlympiads")).toBeInTheDocument();
  });

  it("renders login button when user is not logged in", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });

  it("calls login function when login button is clicked", () => {
    const mockLogin = vi.fn();
    renderHeader({}, { ...mockAuthContext, login: mockLogin });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(mockLogin).toHaveBeenCalled();
  });

  it("renders UserMenu when user is logged in", () => {
    renderHeader({}, { ...mockAuthContext, currentUser: mockUser });
    expect(screen.getByText("User Icon")).toBeInTheDocument();
  });

  it("renders NotificationBell when user is logged in", () => {
    renderHeader({}, { ...mockAuthContext, currentUser: mockUser });
    expect(screen.getByText("NotificationBell")).toBeInTheDocument();
  });

  it("doesn't render NotificationBell when user is not logged in", () => {
    renderHeader();
    expect(screen.queryByText("NotificationBell")).not.toBeInTheDocument();
  });

  it("renders labs link when on labs path", () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={["/labs/some-component"]}>
          <Header {...defaultProps} />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText("Components Directory")).toBeInTheDocument();
  });

  it("doesn't render labs link when not on labs path", () => {
    renderHeader();
    expect(screen.queryByText("Components Directory")).not.toBeInTheDocument();
  });

  it("applies correct background color for admin mode", () => {
    renderHeader(
      {},
      { ...mockAuthContext, currentUser: mockUser, isAdminMode: true },
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-red-900");
  });

  it("applies correct background color for non-admin mode", () => {
    renderHeader(
      {},
      { ...mockAuthContext, currentUser: mockUser, isAdminMode: false },
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-gray-800");
  });

  it("renders full width header", () => {
    renderHeader();
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("w-full");
  });

  it("renders sticky header", () => {
    renderHeader();
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
  });

  it("renders with correct z-index", () => {
    renderHeader();
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("z-50");
  });

  it("closes notification dropdown and user menu when clicking outside", async () => {
    renderHeader({}, { ...mockAuthContext, currentUser: mockUser });
    const notificationBell = screen.getByText("NotificationBell");
    const userMenuButton = screen.getByText("User Icon");

    fireEvent.click(notificationBell);
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByTestId("notification-dropdown"),
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId("user-menu-dropdown"),
      ).not.toBeInTheDocument();
    });
  }, 10000);
});
