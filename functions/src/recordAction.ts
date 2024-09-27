import type { Request } from "express";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type { Action, ChallengeRun } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface RecordActionData {
  challengeRunId: string;
  action: Action;
}

const recordActionHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ success: boolean }> => {
  const { challengeRunId, action } = req.body.data as RecordActionData;
  logger.info(
    `Recording action ${action.type} for challenge run ${challengeRunId} by user ${uid}`,
  );

  try {
    const challengeRunRef = db.collection("challengeRuns").doc(challengeRunId);
    const challengeRunDoc = await challengeRunRef.get();

    if (!challengeRunDoc.exists) {
      logger.error(`Challenge run ${challengeRunId} not found`);
      throw new Error("The specified challenge run does not exist.");
    }

    const challengeRun = challengeRunDoc.data() as ChallengeRun;

    if (challengeRun.userId !== uid) {
      logger.error(
        `User ${uid} is not authorized to modify challenge run ${challengeRunId}`,
      );
      throw new Error("You are not authorized to modify this challenge run.");
    }

    if (challengeRun.completedAt) {
      logger.error(
        `Cannot add action to completed challenge run ${challengeRunId}`,
      );
      throw new Error("Cannot add action to a completed challenge run.");
    }

    // Update the ChallengeRun document
    if (action.problemLabel) {
      // Problem-specific action
      await challengeRunRef.update({
        [`responses.${action.problemLabel}.actions`]:
          FieldValue.arrayUnion(action),
      });
    } else {
      // Global action
      await challengeRunRef.update({
        actions: FieldValue.arrayUnion(action),
      });
    }

    logger.info(
      `Action ${action.type} recorded successfully for challenge run ${challengeRunId}`,
    );
    return { success: true };
  } catch (error) {
    logger.error(`Error in recordAction function: ${error}`);
    throw new Error("An error occurred while recording the challenge action.");
  }
};

export const recordAction = (deps: Dependencies) =>
  createAuthenticatedFunction(recordActionHandler, deps);
