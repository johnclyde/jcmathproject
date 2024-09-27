import type { Request } from "express";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const userNotificationsHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ notifications: Notification[] }> => {
  logger.info("Called notifications endpoint for user", uid);

  const userRef = db.collection("users").doc(uid);
  const notificationsRef = userRef.collection("notifications");
  const snapshot = await notificationsRef
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  logger.info("Loaded snapshot", uid);

  let notifications: Notification[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString(),
      }) as Notification,
  );

  if (notifications.length === 0) {
    const now = Timestamp.now();
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const username = userData?.name || "User";
    logger.info("Seeding initial notification for user", username);

    const welcomeNotification = {
      message: `Welcome to GrindOlympiads, ${username}!`,
      timestamp: now,
      read: false,
    };
    const newNotificationRef = await notificationsRef.add(welcomeNotification);
    notifications = [
      {
        id: newNotificationRef.id,
        ...welcomeNotification,
        timestamp: now.toDate().toISOString(),
      },
    ];
  }

  logger.info("Returning notifications", notifications);
  return { notifications };
};

export const userNotifications = (deps: Dependencies) =>
  createAuthenticatedFunction(userNotificationsHandler, deps);
