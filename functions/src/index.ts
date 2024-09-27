import cors from "cors";
import type { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { adminFetchActions as adminFetchActionsFunction } from "./adminFetchActions";
import { anthropicProxy as anthropicProxyFunction } from "./anthropicProxy";
import { createExam as createExamFunction } from "./createExam";
import { createProblem as createProblemFunction } from "./createProblem";
import { loadExams } from "./examLoader";
import { getChallengeDetails as getChallengeDetailsFunction } from "./getChallengeDetails";
import { getExam as getExamFunction } from "./getExam";
import { labelProblemForExam as labelProblemForExamFunction } from "./labelProblemForExam";
import { listUsers as listUsersFunction } from "./listUsers";
import { loadActions as loadActionsFunction } from "./loadActions";
import { populateActions as populateActionsFunction } from "./populateActions";
import { recordAction as recordActionFunction } from "./recordAction";
import { removeProblemFromExam as removeProblemFromExamFunction } from "./removeProblemFromExam";
import { startChallenge as startChallengeFunction } from "./startChallenge";
import { updateExam as updateExamFunction } from "./updateExam";
import { updateProblem as updateProblemFunction } from "./updateProblem";
import { userNotifications as userNotificationsFunction } from "./userNotifications";
import { userProfile as userProfileFunction } from "./userProfile";

initializeApp();

const db = getFirestore("grindolympiads");
const auth = getAuth();

const corsHandler = cors({ origin: true });

const deps = { db, auth };

export const adminFetchActions = adminFetchActionsFunction(deps);
export const anthropicProxy = anthropicProxyFunction(deps);
export const createExam = createExamFunction(deps);
export const createProblem = createProblemFunction(deps);
export const getChallengeDetails = getChallengeDetailsFunction(deps);
export const getExam = getExamFunction(deps);
export const labelProblemForExam = labelProblemForExamFunction(deps);
export const listUsers = listUsersFunction(deps);
export const loadActions = loadActionsFunction(deps);
export const populateActions = populateActionsFunction(deps);
export const recordAction = recordActionFunction(deps);
export const removeProblemFromExam = removeProblemFromExamFunction(deps);
export const startChallenge = startChallengeFunction(deps);
export const updateProblem = updateProblemFunction(deps);
export const updateExam = updateExamFunction(deps);
export const userNotifications = userNotificationsFunction(deps);
export const userProfile = userProfileFunction(deps);

interface AuthRequest extends Request {
  auth?: {
    uid: string;
  };
}

interface UserData {
  uid: string;
  email: string | null;
  name: string;
  avatar: string;
  role: string;
  isAdmin: boolean;
  isStaff: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  points: number;
  preferences: {
    notifications: boolean;
    theme: string;
  };
}

export const login = onRequest((request: Request, response: Response) => {
  logger.info("login function called");
  return new Promise((resolve) => {
    corsHandler(request, response, async () => {
      logger.info("CORS handler executed");

      const { idToken } = request.body.data;

      if (!idToken) {
        logger.warn("No ID token provided in request body");
        response.status(401).json({
          success: false,
          message: "Unauthorized: No ID token provided",
        });
        resolve();
        return;
      }

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        logger.info(`Processing login for user ${uid}`);

        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();

        let userData: UserData;

        if (userDoc.exists) {
          logger.info(`Existing user found for ${uid}, updating last login`);
          await userRef.update({
            lastLogin: FieldValue.serverTimestamp(),
          });
          userData = userDoc.data() as UserData;
          userData.lastLogin = Timestamp.now();
        } else {
          logger.info(`New user ${uid}, creating user document`);
          const firebaseUser = await auth.getUser(uid);
          userData = {
            uid: uid,
            email: firebaseUser.email || null,
            name:
              firebaseUser.displayName ||
              firebaseUser.email ||
              "Anonymous User",
            avatar: firebaseUser.photoURL || "",
            role: "user",
            isAdmin: false,
            isStaff: false,
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now(),
            points: 0,
            preferences: {
              notifications: true,
              theme: "light",
            },
          };
          await userRef.set(userData);
          logger.info(`New user document created for ${uid}`);
        }

        const responseData = {
          success: true,
          message: "Login successful",
          data: {
            user: {
              ...userData,
              createdAt: userData.createdAt.toDate().toISOString(),
              lastLogin: userData.lastLogin.toDate().toISOString(),
            },
          },
        };

        logger.info("Login successful", uid);
        response.json(responseData);
        resolve();
      } catch (error) {
        logger.error("Invalid ID token", error);
        response.status(401).json({
          success: false,
          message: "Unauthorized: Invalid ID token",
          error: error instanceof Error ? error.message : String(error),
        });
        resolve();
      }
    });
  });
});

export const logout = onRequest((request: Request, response: Response) => {
  return new Promise((resolve) => {
    corsHandler(request, response, async () => {
      const { idToken } = request.body.data;
      if (!idToken) {
        response.status(401).json({
          success: false,
          message: "Unauthorized: No ID token provided",
        });
        resolve();
        return;
      }

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        logger.info("Decoded ID token on logout:", decodedToken);
        response.json({
          success: true,
          message: "Logout successful",
          data: null,
        });
      } catch (error) {
        logger.error("Error during logout:", error);
        response.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      resolve();
    });
  });
});

export const getExamData = onRequest((request: Request, response: Response) => {
  return new Promise((resolve) => {
    corsHandler(request, response, async () => {
      const { competition, year, exam } = request.query;
      if (!competition || !year || !exam) {
        response.status(400).json({
          success: false,
          message: "Missing parameters",
        });
        resolve();
        return;
      }
      try {
        const problemsRef = db
          .collection(competition as string)
          .doc(year as string)
          .collection(exam as string)
          .doc("Problems")
          .collection("Problems");
        const problemsSnapshot = await problemsRef.orderBy("number").get();
        const problems = problemsSnapshot.docs.map((doc) => ({
          problem_id: doc.id,
          ...doc.data(),
        }));

        const commentRef = db
          .collection(competition as string)
          .doc(year as string)
          .collection(exam as string)
          .doc("Comment");
        const commentDoc = await commentRef.get();
        const comment = commentDoc.exists ? commentDoc.data()?.comment : "";

        response.json({
          success: true,
          message: "Exam data fetched successfully",
          data: {
            problems,
            comment,
            competition,
            year,
            exam,
          },
        });
        resolve();
      } catch (error) {
        logger.error(
          `Error fetching exam data for ${competition} ${year} ${exam}`,
          error,
        );
        response.status(500).json({
          success: false,
          message: "An unexpected error occurred while fetching exam data",
          error: error instanceof Error ? error.message : String(error),
        });
        resolve();
      }
    });
  });
});

export const listExams = onRequest((request: Request, response: Response) => {
  return new Promise((resolve) => {
    corsHandler(request, response, async () => {
      try {
        const tests = await loadExams(db);
        response.json({
          success: true,
          message: "Exams listed successfully",
          data: { tests },
        });
        resolve();
      } catch (error) {
        logger.error("Error listing exams", error);
        response.status(500).json({
          success: false,
          message: "An unexpected error occurred while listing exams",
          error: error instanceof Error ? error.message : String(error),
        });
        resolve();
      }
    });
  });
});

export const markNotificationRead = onRequest(
  (request: AuthRequest, response: Response) => {
    return new Promise((resolve) => {
      corsHandler(request, response, async () => {
        if (!request.auth) {
          response.status(401).json({
            success: false,
            message: "Unauthorized",
          });
          resolve();
          return;
        }
        const uid = request.auth.uid;
        const { notificationId } = request.body.data;
        if (!notificationId) {
          response.status(400).json({
            success: false,
            message: "Notification ID is required",
          });
          resolve();
          return;
        }
        try {
          const notificationRef = db
            .collection("users")
            .doc(uid)
            .collection("notifications")
            .doc(notificationId);
          await notificationRef.update({ read: true });
          response.json({
            success: true,
            message: "Notification marked as read",
            data: null,
          });
          resolve();
        } catch (error) {
          logger.error(
            `Error marking notification as read for user ${uid}`,
            error,
          );
          response.status(500).json({
            success: false,
            message:
              "An unexpected error occurred while marking notification as read",
            error: error instanceof Error ? error.message : String(error),
          });
          resolve();
        }
      });
    });
  },
);

export const userProgress = onRequest(
  (request: AuthRequest, response: Response) => {
    return new Promise((resolve) => {
      corsHandler(request, response, async () => {
        if (!request.auth) {
          response.status(401).json({
            success: false,
            message: "Unauthorized",
          });
          resolve();
          return;
        }
        const uid = request.auth.uid;
        try {
          const progressRef = db
            .collection("users")
            .doc(uid)
            .collection("progress");
          const snapshot = await progressRef.get();
          const progressData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate().toISOString(),
          }));
          response.json({
            success: true,
            message: "User progress fetched successfully",
            data: { progress: progressData },
          });
          resolve();
        } catch (error) {
          logger.error(`Error fetching user progress for user ${uid}`, error);
          response.status(500).json({
            success: false,
            message:
              "An unexpected error occurred while fetching user progress",
            error: error instanceof Error ? error.message : String(error),
          });
          resolve();
        }
      });
    });
  },
);

export const submitAnswer = onRequest(
  (request: AuthRequest, response: Response) => {
    return new Promise((resolve) => {
      corsHandler(request, response, async () => {
        if (!request.auth) {
          response.status(401).json({
            success: false,
            message: "Unauthorized",
          });
          resolve();
          return;
        }
        const uid = request.auth.uid;
        const { examId, problemId, answer, timestamp } = request.body.data;
        if (!examId || !problemId || !answer) {
          response.status(400).json({
            success: false,
            message: "Missing required fields",
          });
          resolve();
          return;
        }
        try {
          const userAnswerRef = db
            .collection("users")
            .doc(uid)
            .collection("answers")
            .doc(`${examId}_${problemId}`);

          await userAnswerRef.set(
            {
              examId,
              problemId,
              answer,
              timestamp: Timestamp.fromDate(new Date(timestamp)),
            },
            { merge: true },
          );

          response.json({
            success: true,
            message: "Answer submitted successfully",
            data: null,
          });
          resolve();
        } catch (error) {
          logger.error(`Error submitting answer for user ${uid}`, error);
          response.status(500).json({
            success: false,
            message: "An unexpected error occurred while submitting the answer",
            error: error instanceof Error ? error.message : String(error),
          });
          resolve();
        }
      });
    });
  },
);

export const updateUserProfile = onRequest(
  (request: AuthRequest, response: Response) => {
    return new Promise((resolve) => {
      corsHandler(request, response, async () => {
        if (!request.auth) {
          response.status(401).json({
            success: false,
            message: "Unauthorized",
          });
          resolve();
          return;
        }
        const uid = request.auth.uid;
        const { name, preferences } = request.body.data;
        if (!name && !preferences) {
          response.status(400).json({
            success: false,
            message: "No update data provided",
          });
          resolve();
          return;
        }
        try {
          const userRef = db.collection("users").doc(uid);
          const updateData: {
            [key: string]: Partial<{
              name: string;
              preferences: Record<string, unknown>;
            }>;
          } = {};
          if (name) updateData.name = name;
          if (preferences) updateData.preferences = preferences;

          await userRef.update(updateData);

          response.json({
            success: true,
            message: "User profile updated successfully",
            data: null,
          });
          resolve();
        } catch (error) {
          logger.error(`Error updating user profile for user ${uid}`, error);
          response.status(500).json({
            success: false,
            message:
              "An unexpected error occurred while updating the user profile",
            error: error instanceof Error ? error.message : String(error),
          });
          resolve();
        }
      });
    });
  },
);
