import type { Request } from "express";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import type { UserProfile } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

const userProfileHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ user: UserProfile }> => {
  logger.info(`Fetching user profile for user ${uid}`);

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.error(`User document not found for uid ${uid}`);
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found",
      );
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError(
        "internal",
        "User data is undefined",
      );
    }

    const userProfile: UserProfile = {
      id: uid,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      role: userData.role,
      isAdmin: userData.isAdmin,
      isStaff: userData.isStaff,
      createdAt: userData.createdAt.toDate().toISOString(),
      lastLogin: userData.lastLogin.toDate().toISOString(),
      points: userData.points,
    };

    logger.info(`Successfully fetched user profile for ${uid}`);
    return { user: userProfile };
  } catch (error) {
    logger.error(`Error fetching user profile for ${uid}:`, error);
    throw error;
  }
};

export const userProfile = (deps: Dependencies) =>
  createAuthenticatedFunction(userProfileHandler, deps);
