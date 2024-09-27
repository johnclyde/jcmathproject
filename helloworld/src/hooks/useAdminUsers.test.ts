import { act, renderHook } from "@testing-library/react";
import { type Mock, vi } from "vitest";
import * as firebase from "../firebase";
import useAdminUsers from "./useAdminUsers";

// Mock fetch globally
global.fetch = vi.fn();

// Mock console.error to catch and assert on error messages.
const originalConsoleError = console.error;
console.error = vi.fn();

vi.mock("../firebase", () => ({
  getIdToken: vi.fn(),
}));

describe("useAdminUsers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it("should fetch users and update state", async () => {
    const mockUsers = [
      { id: "1", name: "John Doe", email: "john@example.com", status: "user" },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        status: "admin",
      },
    ];

    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    const { result } = renderHook(() => useAdminUsers());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.users).toEqual([]);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.users).toEqual(mockUsers);
  });

  it("should handle fetch error", async () => {
    const fetchError = new Error("Fetch failed");
    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock).mockRejectedValueOnce(fetchError);

    const { result } = renderHook(() => useAdminUsers());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      "Failed to load users. Please try again later.",
    );
    expect(result.current.users).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching users:",
      fetchError,
    );
  });

  it("should handle API error response", async () => {
    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      "Failed to load users. Please try again later.",
    );
    expect(result.current.users).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching users:",
      expect.any(Error),
    );
  });

  it("should call the correct API endpoint", async () => {
    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/users", {
      headers: {
        Authorization: "Bearer mock-token",
      },
    });
  });

  it("should handle empty response from API", async () => {
    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.users).toEqual([]);
  });

  it("should allow manual refetch", async () => {
    const mockUsers1 = [
      { id: "1", name: "John Doe", email: "john@example.com", status: "user" },
    ];
    const mockUsers2 = [
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        status: "admin",
      },
    ];

    (firebase.getIdToken as Mock).mockResolvedValue("mock-token");
    (global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers2 }),
      });

    const { result } = renderHook(() => useAdminUsers());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.users).toEqual(mockUsers1);

    await act(async () => {
      result.current.fetchUsers();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.users).toEqual(mockUsers2);
  });
});
