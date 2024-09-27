import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  createdAt: string;
  lastLogin: string;
  points: number;
}

const listUsersHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ users: UserData[] }> => {
  logger.info("Called list users endpoint for user", uid);

  // Check if the user is an admin
  const callerRef = db.collection("users").doc(uid);
  const callerDoc = await callerRef.get();
  const callerData = callerDoc.data();

  if (!callerData || !callerData.isAdmin) {
    logger.warn("Non-admin user attempted to list users", uid);
    throw new Error("Unauthorized: Only admin users can list all users");
  }

  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  const users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "N/A",
      email: data.email || "N/A",
      role: data.role || "user",
      isAdmin: data.isAdmin || false,
      isStaff: data.isStaff || false,
      createdAt: data.createdLogin ? data.createdAt.toDate().toISOString() : "",
      lastLogin: data.lastLogin ? data.lastLogin.toDate().toISOString() : "",
      points: data.points || 0,
    };
  });

  logger.info("Returning users list", users.length);
  return { users };
};

export const listUsers = (deps: Dependencies) =>
  createAuthenticatedFunction(listUsersHandler, deps);
