import { forwardRef } from "react";

import type { NotificationBellProps } from "../types";

const NotificationBell = forwardRef<HTMLDivElement, NotificationBellProps>(
  (
    {
      notifications,
      notificationsError,
      showNotifications,
      setShowNotifications,
      markNotificationAsRead,
    },
    ref,
  ) => {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 hover:bg-gray-700 rounded-full"
          aria-label="Notifications"
          type="submit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Notifications</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {!notificationsError && notifications.some((n) => !n.read) && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1">
            {notificationsError ? (
              <div className="px-4 py-2 text-sm text-red-500">
                {notificationsError}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-2 text-sm ${notification.read ? "text-gray-500" : "text-gray-700 font-semibold"}`}
                  onClick={() =>
                    !notification.read &&
                    markNotificationAsRead(notification.id)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      !notification.read &&
                        markNotificationAsRead(notification.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  {notification.message}
                  <div className="text-xs text-gray-400">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);

NotificationBell.displayName = "NotificationBell";

export default NotificationBell;
