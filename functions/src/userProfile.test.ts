import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Request, Response } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { userProfile } from "./index";
import { createCustomRequest } from "./testUtils";

jest.mock("cors", () => {
  return () => (req: Request, res: Response, next: () => void) => {
    next();
  };
});

interface MockAuth {
  verifyIdToken: jest.Mock;
}

interface MockFirestore {
  collection: jest.Mock;
}

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
}));

jest.mock("firebase-admin/firestore", () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  return {
    getFirestore: jest.fn(() => mockFirestore),
  };
});

describe("userProfile function", () => {
  let loggerInfoSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Suppress logs and allow testing
    loggerInfoSpy = jest.spyOn(logger, "info").mockImplementation(jest.fn());
    loggerErrorSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let mockAuth: MockAuth;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = getAuth() as unknown as MockAuth;
    mockFirestore = getFirestore() as unknown as MockFirestore;
  });

  it("should handle successful profile fetch", async () => {
    const mockUid = "testUid123";
    const mockUserData = {
      avatar: "https://example.com/photo.jpg",
      createdAt: { toDate: () => new Date("2023-01-01") },
      email: "test@example.com",
      isAdmin: false,
      isStaff: false,
      lastLogin: { toDate: () => new Date("2023-05-01") },
      name: "Test User",
      points: 100,
      role: "user",
    };

    mockAuth.verifyIdToken.mockResolvedValue({ uid: mockUid });
    (mockFirestore.collection().doc().get as jest.Mock).mockResolvedValue({
      exists: true,
      data: () => mockUserData,
    });

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userProfile(
      createCustomRequest<{ idToken: string }>({ idToken: "valid-id-token" }),
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Operation successful",
      data: {
        user: {
          avatar: "https://example.com/photo.jpg",
          createdAt: "2023-01-01T00:00:00.000Z",
          email: "test@example.com",
          id: "testUid123",
          isAdmin: false,
          isStaff: false,
          lastLogin: "2023-05-01T00:00:00.000Z",
          name: "Test User",
          points: 100,
          role: "user",
        },
      },
    });

    // Assert the first info log was called
    expect(loggerInfoSpy).toHaveBeenNthCalledWith(
      1,
      "Fetching user profile for user testUid123",
    );

    // Assert the second info log was called
    expect(loggerInfoSpy).toHaveBeenNthCalledWith(
      2,
      "Successfully fetched user profile for testUid123",
    );
  });

  it("should handle user not found", async () => {
    const mockUid = "nonexistentUid";

    mockAuth.verifyIdToken.mockResolvedValue({ uid: mockUid });
    (mockFirestore.collection().doc().get as jest.Mock).mockResolvedValue({
      exists: false,
    });

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userProfile(
      createCustomRequest<{ idToken: string }>({ idToken: "valid-id-token" }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An unexpected error occurred",
      error: "User profile not found",
    });

    // Assert the first error log was called
    expect(loggerErrorSpy).toHaveBeenNthCalledWith(
      1,
      "User document not found for uid nonexistentUid",
    );

    // Assert the second error log was called
    expect(loggerErrorSpy).toHaveBeenNthCalledWith(
      2,
      "Error fetching user profile for nonexistentUid:",
      expect.any(Error),
    );
  });

  it("should handle invalid token", async () => {
    mockAuth.verifyIdToken.mockRejectedValue(new Error("Invalid token"));

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userProfile(
      createCustomRequest<{ idToken: string }>({ idToken: "invalid-token" }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An unexpected error occurred",
      error: "Invalid token",
    });

    expect(loggerErrorSpy).toHaveBeenNthCalledWith(
      1,
      "Error in authenticated function:",
      expect.any(Error),
    );
  });
});
