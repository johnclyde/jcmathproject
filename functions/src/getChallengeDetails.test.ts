import type { Request } from "express";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { getChallengeDetailsHandler } from "./getChallengeDetails";

describe("getChallengeDetailsHandler", () => {
  it("should return normalized problem structure", async () => {
    const loggerInfoSpy = jest
      .spyOn(logger, "info")
      .mockImplementation(jest.fn());

    const mockChallenge = {
      id: "challenge1",
      name: "Test Challenge",
      type: "firstTen",
      examType: "AMC-10",
      problems: [
        { problemId: "problem1", label: "1", examId: "exam1" },
        { problemId: "problem2", label: "2", examId: "exam1" },
      ],
    };

    const mockProblemData = {
      problem1: {
        label: "1",
        details: {
          statement: "Problem 1 statement",
          type: "multiple_choice",
          correctAnswer: "A",
        },
      },
      problem2: {
        statement: "Problem 2 statement",
        type: "short_answer",
        correctAnswer: "42",
      },
    };

    const mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn((id: string) => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () =>
            id === "challenge1"
              ? mockChallenge
              : mockProblemData[id as keyof typeof mockProblemData],
        }),
      })),
    };

    const mockRequest = {
      body: { data: { challengeId: "challenge1" } },
    } as Partial<Request> as Request;

    const result = await getChallengeDetailsHandler(mockRequest, "testUser", {
      db: mockDb as unknown as Firestore,
      auth: {} as Auth,
    });

    expect(result).toEqual({
      challenge: {
        id: "challenge1",
        name: "Test Challenge",
        type: "firstTen",
        examType: "AMC-10",
        problems: [
          {
            problemId: "problem1",
            label: "1",
            statement: "Problem 1 statement",
            type: "multiple_choice",
            correctAnswer: "A",
            examId: "exam1",
          },
          {
            problemId: "problem2",
            label: "2",
            statement: "Problem 2 statement",
            type: "short_answer",
            correctAnswer: "42",
            examId: "exam1",
          },
        ],
      },
    });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      "Fetching challenge details for challenge challenge1",
    );

    loggerInfoSpy.mockRestore();
  });
});
