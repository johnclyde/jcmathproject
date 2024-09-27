import type { Request } from "express";
import type { DocumentData } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type {
  Action,
  ChallengeData,
  ChallengeRun,
  ExamData,
  UserProfile,
} from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface AdminFetchActionsData {
  date: string; // The selected date from the frontend
}

export interface EnhancedAction extends Action {
  id?: string;
  userName?: string;
  challengeName?: string;
  examName?: string;
}

export interface ActionSnapshot {
  docs: Array<{
    data(): DocumentData;
    id: string;
  }>;
}

function isEnhancedAction(data: DocumentData): data is EnhancedAction {
  return typeof data.type === "string" && typeof data.timestamp === "string";
}

/**
 * Handles fetching actions for admin users
 * @param {Request} req - The request object
 * @param {string} uid - The user ID
 * @param {Dependencies} deps - The dependencies object
 * @return {Promise<{
 *     actions: EnhancedAction[],
 *     users: UserProfile[],
 *     challengeRuns: ChallengeRun[]
 * }>} - A promise resolving with the fetched data.
 *
 * IMPORTANT: This function contains crucial logic for gathering and processing actions.
 * Any modifications to this function must carefully preserve the existing behavior,
 * particularly the way actions are collected and grouped.
 *
 * Key points to remember:
 * 1. Actions are fetched for a specific date range.
 * 2. Actions are divided into two categories: those associated with challenges and other.
 * 3. For actions not associated with challenges, add them if they fall in the date range.
 * 4. For actions associated with challenge runs, they are grouped by their challenge run ID.
 * 5. A challenge run is included if any of its actions fall within the specified date range.
 * 6. ALL actions for an included challenge run are preserved, regardless of their timestamp.
 *
 * This approach ensures a comprehensive view of user activity, including both isolated actions
 * and those that are part of larger challenge runs, maintaining context and completeness of data.
 */
export const adminFetchActionsHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{
  actions: EnhancedAction[];
  users: UserProfile[];
  challengeRuns: ChallengeRun[];
}> => {
  logger.info(`Admin fetching actions, requested by user ${uid}`);

  // Check if the user is an admin
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (!userData || !userData.isAdmin) {
    logger.error(`Unauthorized access attempt by non-admin user ${uid}`);
    throw new Error("Unauthorized: Only admin users can fetch all actions");
  }

  const { date } = req.body.data as AdminFetchActionsData;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const actionsSnapshot: ActionSnapshot = await db.collection("actions").get();
  const usersSnapshot = await db.collection("users").get();
  const challengesSnapshot = await db.collection("challenges").get();
  const examsSnapshot = await db.collection("exams").get();

  const users = usersSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as UserProfile,
  );
  const usersMap = new Map(users.map((user) => [user.id, user]));
  const challenges = new Map(
    challengesSnapshot.docs.map((doc) => [doc.id, doc.data() as ChallengeData]),
  );
  const exams = new Map(
    examsSnapshot.docs.map((doc) => [doc.id, doc.data() as ExamData]),
  );

  /**
   * CRITICAL SECTION: Action Gathering Logic
   * The following code block contains the crucial logic for gathering and processing actions.
   * This logic MUST be preserved in any future modifications or refactors.
   * It ensures the integrity and completeness of the action data being fetched.
   */
  const allActions: EnhancedAction[] = [];
  const challengeRunActionsMap: { [key: string]: EnhancedAction[] } = {};
  const validChallengeRunIds = new Set<string>();
  const relevantActions: EnhancedAction[] = [];
  const relevantUserIds = new Set<string>();

  for (const doc of actionsSnapshot.docs) {
    const data = doc.data();
    if (isEnhancedAction(data)) {
      allActions.push({
        ...data,
        id: doc.id,
      });
    } else {
      logger.warn(`Skipping invalid action document: ${doc.id}`);
    }
  }

  for (const action of allActions) {
    const actionDate = new Date(action.timestamp);

    // Enhance action with user and challenge information
    action.userName = usersMap.get(action.userId || "")?.name || "Unknown User";

    if (action.challengeRunId) {
      const challenge = challenges.get(action.challengeRunId.split("_")[0]);
      if (challenge) {
        action.challengeName = challenge.name;
        if (challenge.examIds && challenge.examIds.length > 0) {
          const exam = exams.get(challenge.examIds[0]);
          action.examName = exam ? `${exam.year} ${exam.name}` : undefined;
        }
      }
    }

    // IMPORTANT: This logic for gathering actions is crucial and must be preserved
    if (!action.challengeRunId) {
      // For actions not associated with a challenge, add them if they're within the date range.
      if (actionDate >= startOfDay && actionDate <= endOfDay) {
        relevantActions.push(action);
        if (action.userId) relevantUserIds.add(action.userId);
      }
    } else {
      // For actions associated with a challenge run, group them by challenge run ID
      if (!challengeRunActionsMap[action.challengeRunId]) {
        challengeRunActionsMap[action.challengeRunId] = [];
      }
      challengeRunActionsMap[action.challengeRunId].push(action);

      // Mark this challenge run as valid if any of its actions fall within the date range
      if (actionDate >= startOfDay && actionDate <= endOfDay) {
        validChallengeRunIds.add(action.challengeRunId);
        if (action.userId) relevantUserIds.add(action.userId);
      }
    }
  }

  // Add all actions from valid challenge runs to the final result
  for (const challengeRunId of validChallengeRunIds) {
    relevantActions.push(...challengeRunActionsMap[challengeRunId]);
  }

  // Fetch the challenge runs for the valid challenge run IDs
  const challengeRuns: ChallengeRun[] = await Promise.all(
    Array.from(validChallengeRunIds).map(async (id) => {
      const doc = await db.collection("challengeRuns").doc(id).get();
      return { id, ...doc.data() } as ChallengeRun;
    }),
  );

  // Filter users to include only those with actions in the date range
  const relevantUsers = users.filter((user) => relevantUserIds.has(user.id));

  return {
    actions: relevantActions,
    users: relevantUsers,
    challengeRuns: challengeRuns,
  };
};

export const adminFetchActions = (deps: Dependencies) =>
  createAuthenticatedFunction(adminFetchActionsHandler, deps);
