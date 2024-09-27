import { act, renderHook, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { type Mock, vi } from "vitest";
import { getIdToken } from "../firebase";
import useNotifications from "./useNotifications";

vi.mock("../firebase", () => ({
  getIdToken: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

describe("useNotifications", () => {
  const mockUser: Partial<User> = { uid: "testUser123" };
  const mockNotifications = [
    {
      id: "1",
      message: "Test notification 1",
      timestamp: "2023-05-01T10:00:00Z",
      read: false,
    },
    {
      id: "2",
      message: "Test notification 2",
      timestamp: "2023-05-02T11:00:00Z",
      read: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getIdToken as Mock).mockResolvedValue("mock-id-token");
    (getFunctions as Mock).mockReturnValue({});
    (httpsCallable as Mock).mockImplementation(() => vi.fn());
  });

  it("should fetch notifications when user is logged in", async () => {
    const mockUserNotificationsFunction = vi
      .fn()
      .mockResolvedValue({ data: { notifications: mockNotifications } });
    (httpsCallable as Mock).mockReturnValue(mockUserNotificationsFunction);

    const { result } = renderHook(() => useNotifications(mockUser as User));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.notificationsError).toBeNull();

    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockNotifications);
    });

    expect(result.current.notificationsError).toBeNull();
    expect(mockUserNotificationsFunction).toHaveBeenCalledWith({
      idToken: "mock-id-token",
    });
  });

  it("should set error when fetching notifications fails", async () => {
    const mockError = new Error("Failed to fetch notifications");
    const mockUserNotificationsFunction = vi.fn().mockRejectedValue(mockError);
    (httpsCallable as Mock).mockReturnValue(mockUserNotificationsFunction);

    const { result } = renderHook(() => useNotifications(mockUser as User));

    await waitFor(() => {
      expect(result.current.notificationsError).toBe(
        "Unable to load notifications. Please try again later.",
      );
    });

    expect(result.current.notifications).toEqual([]);
  });

  it("should not fetch notifications when user is not logged in", () => {
    const mockUserNotificationsFunction = vi.fn();
    (httpsCallable as Mock).mockReturnValue(mockUserNotificationsFunction);

    renderHook(() => useNotifications(null));

    expect(mockUserNotificationsFunction).not.toHaveBeenCalled();
  });

  it("should mark notification as read", async () => {
    const mockMarkNotificationReadFunction = vi.fn().mockResolvedValue({});
    (httpsCallable as Mock).mockImplementation((_, functionName) => {
      if (functionName === "userNotifications") {
        return vi
          .fn()
          .mockResolvedValue({ data: { notifications: mockNotifications } });
      }
      if (functionName === "markNotificationRead") {
        return mockMarkNotificationReadFunction;
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useNotifications(mockUser as User));

    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockNotifications);
    });

    await act(async () => {
      await result.current.markNotificationAsRead("1");
    });

    expect(mockMarkNotificationReadFunction).toHaveBeenCalledWith({
      notificationId: "1",
      idToken: "mock-id-token",
    });

    expect(result.current.notifications[0].read).toBe(true);
  });

  it("should handle error when marking notification as read fails", async () => {
    const mockError = new Error("Failed to mark notification as read");
    const mockMarkNotificationReadFunction = vi
      .fn()
      .mockRejectedValue(mockError);
    (httpsCallable as Mock).mockImplementation((_, functionName) => {
      if (functionName === "userNotifications") {
        return vi
          .fn()
          .mockResolvedValue({ data: { notifications: mockNotifications } });
      }
      if (functionName === "markNotificationRead") {
        return mockMarkNotificationReadFunction;
      }
      return vi.fn();
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useNotifications(mockUser as User));

    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockNotifications);
    });

    await act(async () => {
      await result.current.markNotificationAsRead("1");
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error marking notification as read:",
      mockError,
    );
    expect(result.current.notifications[0].read).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should allow manual refresh of notifications", async () => {
    const mockUserNotificationsFunction = vi
      .fn()
      .mockResolvedValueOnce({ data: { notifications: mockNotifications } })
      .mockResolvedValueOnce({
        data: {
          notifications: [
            ...mockNotifications,
            {
              id: "3",
              message: "New notification",
              timestamp: "2023-05-03T12:00:00Z",
              read: false,
            },
          ],
        },
      });
    (httpsCallable as Mock).mockReturnValue(mockUserNotificationsFunction);

    const { result } = renderHook(() => useNotifications(mockUser as User));

    await waitFor(() => {
      expect(result.current.notifications).toEqual([
        {
          id: "1",
          message: "Test notification 1",
          timestamp: "2023-05-01T10:00:00Z",
          read: false,
        },
        {
          id: "2",
          message: "Test notification 2",
          timestamp: "2023-05-02T11:00:00Z",
          read: true,
        },
      ]);
    });

    await act(async () => {
      await result.current.fetchNotifications();
    });

    await waitFor(() => {
      expect(result.current.notifications).toEqual([
        {
          id: "1",
          message: "Test notification 1",
          timestamp: "2023-05-01T10:00:00Z",
          read: false,
        },
        {
          id: "2",
          message: "Test notification 2",
          timestamp: "2023-05-02T11:00:00Z",
          read: true,
        },
        {
          id: "3",
          message: "New notification",
          timestamp: "2023-05-03T12:00:00Z",
          read: false,
        },
      ]);
    });

    expect(mockUserNotificationsFunction).toHaveBeenCalledTimes(2);
  });
});
