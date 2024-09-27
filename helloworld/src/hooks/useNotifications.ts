import type { User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useCallback, useEffect, useState } from "react";
import { getIdToken } from "../firebase";
import type { NotificationType } from "../types";

const functions = getFunctions();

const useNotifications = (currentUser: User | null) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setNotificationsError(null);
      return;
    }

    try {
      const idToken = await getIdToken();
      const userNotificationsFunction = httpsCallable(
        functions,
        "userNotifications",
      );
      const result = await userNotificationsFunction({ idToken });
      setNotifications(
        (result.data as { notifications: NotificationType[] }).notifications,
      );
      setNotificationsError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotificationsError(
        "Unable to load notifications. Please try again later.",
      );
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const idToken = await getIdToken();
      const markNotificationReadFunction = httpsCallable(
        functions,
        "markNotificationRead",
      );
      await markNotificationReadFunction({ notificationId, idToken });

      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return {
    notifications,
    notificationsError,
    markNotificationAsRead,
    fetchNotifications,
  };
};

export default useNotifications;
