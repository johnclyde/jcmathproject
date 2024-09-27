import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { Action } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface LoadActionsData {
  challengeRunId: string;
}

const loadActionsHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ actions: Action[] }> => {
  const { challengeRunId } = req.body.data as LoadActionsData;
  logger.info(
    `Loading actions for challenge run ${challengeRunId} by user ${uid}`,
  );

  try {
    const challengeRunRef = db.collection("challengeRuns").doc(challengeRunId);
    const challengeRunDoc = await challengeRunRef.get();

    if (!challengeRunDoc.exists) {
      logger.error(`Challenge run ${challengeRunId} not found`);
      throw new Error("The specified challenge run does not exist.");
    }

    const challengeRun = challengeRunDoc.data();

    if (challengeRun?.userId !== uid) {
      logger.error(
        `User ${uid} is not authorized to load actions for challenge run ${challengeRunId}`,
      );
      throw new Error(
        "You are not authorized to load actions for this challenge run.",
      );
    }

    const actions: Action[] = challengeRun?.actions || [];

    logger.info(
      `Successfully loaded ${actions.length} actions for challenge run ${challengeRunId}`,
    );
    return { actions };
  } catch (error) {
    logger.error(`Error in loadActions function: ${error}`);
    throw new Error("An error occurred while loading the challenge actions.");
  }
};

export const loadActions = (deps: Dependencies) =>
  createAuthenticatedFunction(loadActionsHandler, deps);
