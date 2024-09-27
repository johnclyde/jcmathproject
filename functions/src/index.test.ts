import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import type { Request, Response } from "firebase-functions";
import * as functions from "firebase-functions-test";
import * as logger from "firebase-functions/logger";
import * as myFunctions from "./index";
import { createCustomRequest } from "./testUtils";

const testEnv = functions.default();

let loggerInfoSpy: jest.SpyInstance;
let loggerErrorSpy: jest.SpyInstance;

jest.mock("cors", () => {
  return () => (req: Request, res: Response, next: () => void) => {
    next();
  };
});

const mockTimestamp = {
  now: jest.fn().mockReturnValue({
    toDate: jest.fn().mockReturnValue(new Date("2023-01-01T00:00:00Z")),
  }),
};

const mockUserDoc = {
  exists: true,
  data: jest.fn().mockReturnValue({
    email: "test@example.com",
    name: "Test User",
    avatar: "https://example.com/photo.jpg",
    role: "user",
    isAdmin: false,
    isStaff: false,
    createdAt: mockTimestamp.now(),
    lastLogin: mockTimestamp.now(),
    points: 100,
    preferences: {
      notifications: true,
      theme: "light",
    },
  }),
};

jest.mock("firebase-admin", () => {
  return {
    initializeApp: jest.fn(),
    credential: {
      applicationDefault: jest.fn(),
    },
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve(mockUserDoc)),
          update: jest.fn(),
          set: jest.fn(),
        })),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
      })),
    })),
  };
});

interface MockAuth {
  verifyIdToken: jest.Mock;
  getUser: jest.Mock;
}

jest.mock("firebase-admin/auth", () => {
  const authMock: MockAuth = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  };
  return {
    getAuth: jest.fn(() => authMock),
  };
});

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve(mockUserDoc)),
        update: jest.fn(),
        set: jest.fn(),
      })),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
    })),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(),
  },
  Timestamp: {
    now: jest.fn().mockReturnValue({
      toDate: jest.fn().mockReturnValue(new Date("2023-01-01T00:00:00Z")),
    }),
  },
}));

describe("login function", () => {
  let auth: MockAuth;
  let adminInitStub: jest.SpyInstance;
  let firestoreStub: jest.SpyInstance;

  beforeAll(() => {
    auth = getAuth() as unknown as MockAuth;
    adminInitStub = jest.spyOn(admin, "initializeApp").mockImplementation();
    loggerInfoSpy = jest.spyOn(logger, "info").mockImplementation(jest.fn());
    loggerErrorSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());
  });

  beforeEach(() => {
    firestoreStub = jest.spyOn(admin, "firestore").mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    } as unknown as admin.firestore.Firestore);

    Object.defineProperty(admin.firestore, "FieldValue", {
      value: { serverTimestamp: jest.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    firestoreStub.mockRestore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    testEnv.cleanup();
    adminInitStub.mockRestore();
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("should handle successful login", async () => {
      const mockUid = "testUid123";
      const mockIdToken = "valid-mock-token";

      auth.verifyIdToken.mockResolvedValue({ uid: mockUid });

      const mockUserData = {
        uid: mockUid,
        email: "test@example.com",
        displayName: "Test User",
        photoURL: "https://example.com/photo.jpg",
      };

      auth.getUser.mockResolvedValue(mockUserData);

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await myFunctions.login(
        createCustomRequest<{ idToken: string }>({ idToken: mockIdToken }),
        res,
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful",
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: "test@example.com",
              name: "Test User",
              avatar: "https://example.com/photo.jpg",
              role: "user",
              isAdmin: false,
              isStaff: false,
              points: 100,
            }),
          }),
        }),
      );

      expect(loggerInfoSpy).toHaveBeenCalledWith("login function called");
      expect(loggerInfoSpy).toHaveBeenCalledWith("CORS handler executed");
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        "Processing login for user testUid123",
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        `Existing user found for ${mockUid}, updating last login`,
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith("Login successful", mockUid);
    });
  });

  it("should handle invalid token", async () => {
    const invalidToken = "invalidToken";

    auth.verifyIdToken.mockRejectedValue(new Error("Invalid token"));

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await myFunctions.login(
      createCustomRequest<{ idToken: string }>({ idToken: invalidToken }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Unauthorized: Invalid ID token",
      }),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith("login function called");
    expect(loggerInfoSpy).toHaveBeenCalledWith("CORS handler executed");
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Invalid ID token",
      expect.any(Error),
    );
  });
});
