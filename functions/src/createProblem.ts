import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { ProblemDetails } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

const createProblemHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{
  success: boolean;
  problemId?: string;
  message?: string;
  error?: string;
}> => {
  const { problem } = req.body.data as { problem: ProblemDetails };
  logger.info(`Creating new problem by user ${uid}`);

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Only admin users can create problems",
      };
    }

    // Create a new problem document
    const problemRef = await db.collection("problems").add({
      details: problem,
      examRefs: {},
    });

    logger.info(`New problem created with ID: ${problemRef.id}`);

    return {
      success: true,
      problemId: problemRef.id,
      message: "Problem created successfully",
    };
  } catch (error) {
    logger.error("Error creating new problem:", error);
    return { success: false, error: "Failed to create new problem" };
  }
};

export const createProblem = (deps: Dependencies) =>
  createAuthenticatedFunction(createProblemHandler, deps);
