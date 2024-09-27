import type { Request } from "express";
import type { Auth } from "firebase-admin/auth";
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  type EnhancedAction,
  adminFetchActionsHandler,
} from "./adminFetchActions";
import type { ActionType, ChallengeData, ExamData, UserProfile } from "./types";

jest.mock("./utils", () => ({
  createAuthenticatedFunction: jest.fn(),
}));

describe("adminFetchActionsHandler", () => {
  let loggerInfoSpy: jest.SpyInstance;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    loggerInfoSpy = jest.spyOn(logger, "info").mockImplementation(jest.fn());
    mockRequest = {
      body: {
        data: {
          date: "2023-10-01",
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch actions for admin users correctly", async () => {
    // Mock actions data
    const mockActions: EnhancedAction[] = [
      {
        id: "action1",
        userId: "user1",
        timestamp: "2023-10-01T12:00:00Z",
        challengeRunId: "challenge1_run1",
        type: "navigateAway" as ActionType,
      },
      {
        id: "action2",
        userId: "user2",
        timestamp: "2023-10-01T13:00:00Z",
        type: "createChallengeRun" as ActionType,
      },
    ];

    // Mock users data
    const mockUsers: UserProfile[] = [
      { id: "user1", name: "User One" } as UserProfile,
      { id: "user2", name: "User Two" } as UserProfile,
    ];

    // Mock challenges data
    const mockChallenges: ChallengeData[] = [
      {
        id: "challenge1",
        name: "Challenge One",
        examIds: ["exam1"],
      } as ChallengeData,
    ];

    // Mock exams data
    const mockExams: ExamData[] = [
      { id: "exam1", name: "Exam One", year: "2023" } as ExamData,
    ];

    // Mock challenge runs data
    const mockChallengeRuns = [
      { id: "challenge1_run1", name: "Challenge One Run One" },
    ];

    const mockDb = createMockDb(
      mockActions,
      mockUsers,
      mockChallenges,
      mockExams,
      mockChallengeRuns,
    );

    // Call the function
    const result = await adminFetchActionsHandler(
      mockRequest as Request,
      "adminUser",
      { db: mockDb as unknown as Firestore, auth: {} as unknown as Auth },
    );

    // Expected result
    const expectedActions: EnhancedAction[] = [
      {
        id: "action2",
        timestamp: "2023-10-01T13:00:00Z",
        userId: "user2",
        userName: "User Two",
        type: "createChallengeRun",
      },
      {
        challengeName: "Challenge One",
        challengeRunId: "challenge1_run1",
        examName: "2023 Exam One",
        id: "action1",
        timestamp: "2023-10-01T12:00:00Z",
        userId: "user1",
        userName: "User One",
        type: "navigateAway",
      },
    ];

    const expectedUsers = [
      { id: "user1", name: "User One" },
      { id: "user2", name: "User Two" },
    ];

    const expectedChallengeRuns = [
      { id: "challenge1_run1", name: "Challenge One Run One" },
    ];

    // Assertions
    expect(result.actions).toEqual(expectedActions);
    expect(result.users).toEqual(expectedUsers);
    expect(result.challengeRuns).toEqual(expectedChallengeRuns);

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      "Admin fetching actions, requested by user adminUser",
    );
  });
});

/**
 * Creates a mock Firestore database for testing purposes.
 *
 * @param {Action[]} mockActions - Array of mock actions
 * @param {UserProfile[]} mockUsers - Array of mock user profiles
 * @param {ChallengeData[]} mockChallenges - Array of mock challenge data
 * @param {ExamData[]} mockExams - Array of mock exam data
 * @param {Array<{ id: string; name: string }>} mockChallengeRuns - Array of mock challenge runs
 * @return {Partial<Firestore>} A partial mock of Firestore
 */
function createMockDb(
  mockActions: EnhancedAction[],
  mockUsers: UserProfile[],
  mockChallenges: ChallengeData[],
  mockExams: ExamData[],
  mockChallengeRuns: { id: string; name: string }[],
): Partial<Firestore> {
  const mockCollection = jest.fn((collectionName: string) => {
    const mockDoc = jest.fn((docId: string) => {
      const mockGet = jest.fn().mockImplementation(() => {
        switch (collectionName) {
          case "users":
            if (docId === "adminUser") {
              return Promise.resolve({
                exists: true,
                data: () => ({
                  id: "adminUser",
                  isAdmin: true,
                  name: "Admin User",
                }),
              });
            }
            break;
          case "challengeRuns":
            if (docId === "challenge1_run1") {
              return Promise.resolve({
                exists: true,
                data: () => mockChallengeRuns[0],
              });
            }
            break;
        }
        return Promise.resolve({ exists: false });
      });

      return {
        get: mockGet,
      } as unknown as DocumentReference;
    });

    const mockGet = jest.fn().mockImplementation(() => {
      switch (collectionName) {
        case "actions":
          return Promise.resolve({
            docs: mockActions.map((action) => ({
              id: action.id,
              data: () => action,
            })),
          });
        case "users":
          return Promise.resolve({
            docs: mockUsers.map((user) => ({ id: user.id, data: () => user })),
          });
        case "challenges":
          return Promise.resolve({
            docs: mockChallenges.map((challenge) => ({
              id: challenge.id,
              data: () => challenge,
            })),
          });
        case "exams":
          return Promise.resolve({
            docs: mockExams.map((exam) => ({ id: exam.id, data: () => exam })),
          });
      }
      return Promise.resolve({ docs: [] });
    });

    return {
      doc: mockDoc,
      get: mockGet,
    } as unknown as CollectionReference;
  });

  return {
    collection: mockCollection,
  };
}
