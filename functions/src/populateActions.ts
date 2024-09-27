import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { Action } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface Stats {
  actionsAlreadyPresent: number;
  actionsAdded: number;
  challengeRunsProcessed: number;
}

const populateActionsHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ message: string; stats: Stats }> => {
  logger.info(`Populating actions collection, requested by user ${uid}`);

  const stats: Stats = {
    actionsAlreadyPresent: 0,
    actionsAdded: 0,
    challengeRunsProcessed: 0,
  };

  const batchSize = 500;
  const query = db.collection("challengeRuns").limit(batchSize);
  const snapshot = await query.get();

  if (snapshot.empty) {
    logger.info("No challenge runs found to process");
    return {
      message: "No challenge runs found to process",
      stats,
    };
  }

  const allActions: Action[] = [];

  for (const doc of snapshot.docs) {
    const runData = doc.data();
    const runId = doc.id;

    // Process top-level actions
    const topLevelActions: Action[] = (runData.actions || [])
      .filter(
        (action: Partial<Action>): action is Action =>
          typeof action.type === "string" &&
          typeof action.timestamp === "string",
      )
      .map((action: Action) => ({
        ...action,
        challengeRunId: runId,
        userId: runData.userId,
      }));
    allActions.push(...topLevelActions);

    // Process problem-specific actions
    for (const [problemLabel, problemData] of Object.entries(
      runData.responses || {},
    )) {
      if (
        typeof problemData === "object" &&
        problemData !== null &&
        "actions" in problemData
      ) {
        const problemActions: Action[] = (
          (problemData as { actions: Partial<Action>[] }).actions || []
        )
          .filter(
            (action: Partial<Action>): action is Action =>
              typeof action.type === "string" &&
              typeof action.timestamp === "string",
          )
          .map((action: Action) => ({
            ...action,
            challengeRunId: runId,
            userId: runData.userId,
            problemLabel,
          }));
        allActions.push(...problemActions);
      }
    }

    stats.challengeRunsProcessed++;
  }

  // Sort actions chronologically
  allActions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Add actions to the actions collection
  const actionsRef = db.collection("actions");
  const batch = db.batch();
  const existingActionIds = new Set(
    (await actionsRef.listDocuments()).map((doc) => doc.id),
  );

  for (const action of allActions) {
    const timestamp = new Date(action.timestamp);
    const docId = timestamp
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    if (existingActionIds.has(docId)) {
      stats.actionsAlreadyPresent++;
    } else {
      const actionRef = actionsRef.doc(docId);
      batch.set(actionRef, action);
      stats.actionsAdded++;
    }
  }

  await batch.commit();

  logger.info("Finished populating actions collection", stats);
  return {
    message:
      "Actions collection has been updated with chronologically sorted actions.",
    stats,
  };
};

export const populateActions = (deps: Dependencies) =>
  createAuthenticatedFunction(populateActionsHandler, deps);
