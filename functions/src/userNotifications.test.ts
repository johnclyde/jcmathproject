import { getAuth } from "firebase-admin/auth";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import type { Request, Response } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { userNotifications } from "./index";
import { createCustomRequest } from "./testUtils";

jest.mock("cors", () => {
  return () => (req: Request, res: Response, next: () => void) => {
    next();
  };
});

interface MockAuth {
  verifyIdToken: jest.Mock;
  getUser: jest.Mock;
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
    add: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  const actualFirestore = jest.requireActual("firebase-admin/firestore");
  return {
    getFirestore: jest.fn(() => mockFirestore),
    Timestamp: {
      now: jest.fn().mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date("2023-01-01T00:00:00Z")),
      }),
      fromDate: jest.fn().mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date("2023-01-01T00:00:00Z")),
      }),
    },
    FieldValue: actualFirestore.FieldValue,
  };
});

describe("userNotifications function", () => {
  let mockAuth: MockAuth;
  let mockFirestore: MockFirestore;
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = getAuth() as unknown as MockAuth;
    mockFirestore = getFirestore() as unknown as MockFirestore;
  });

  it("should return existing notifications", async () => {
    const mockUid = "mock-uid";
    mockAuth.verifyIdToken.mockResolvedValue({ uid: mockUid });

    const mockNotifications = [
      {
        id: "notif1",
        data: () => ({
          message: "Test Notification 1",
          timestamp: Timestamp.fromDate(new Date("2023-01-01T00:00:00Z")),
          read: false,
        }),
      },
      {
        id: "notif2",
        data: () => ({
          message: "Test Notification 2",
          timestamp: Timestamp.fromDate(new Date("2023-01-01T00:00:00Z")),
          read: true,
        }),
      },
    ];

    mockFirestore
      .collection()
      .doc()
      .collection()
      .orderBy()
      .limit()
      .get.mockResolvedValue({
        docs: mockNotifications,
      });

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userNotifications(
      createCustomRequest<{ idToken: string }>({ idToken: "valid-id-token" }),
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Operation successful",
      data: {
        notifications: [
          {
            id: "notif1",
            message: "Test Notification 1",
            timestamp: "2023-01-01T00:00:00.000Z",
            read: false,
          },
          {
            id: "notif2",
            message: "Test Notification 2",
            timestamp: "2023-01-01T00:00:00.000Z",
            read: true,
          },
        ],
      },
    });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      "Called notifications endpoint for user",
      "mock-uid",
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith("Loaded snapshot", "mock-uid");
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      "Returning notifications",
      expect.arrayContaining([
        expect.objectContaining({
          id: "notif1",
          message: "Test Notification 1",
          timestamp: "2023-01-01T00:00:00.000Z",
          read: false,
        }),
        expect.objectContaining({
          id: "notif2",
          message: "Test Notification 2",
          timestamp: "2023-01-01T00:00:00.000Z",
          read: true,
        }),
      ]),
    );
  });

  it("should handle missing ID token", async () => {
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userNotifications(
      createCustomRequest<Record<string, never>>({}),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Unauthorized: No ID token provided",
      }),
    );

    // Assert logger calls
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it("should handle invalid ID token", async () => {
    mockAuth.verifyIdToken.mockRejectedValue(new Error("Invalid token"));

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await userNotifications(
      createCustomRequest<{ idToken: string }>({ idToken: "invalid-token" }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "An unexpected error occurred",
        error: "Invalid token",
      }),
    );

    // Assert logger calls
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Error in authenticated function:",
      expect.any(Error),
    );
  });
});
