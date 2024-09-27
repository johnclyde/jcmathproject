import type React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import useNotifications from "./hooks/useNotifications";
import { NotificationType } from "./types";
import type {
  HeaderProps,
  NotificationBellProps,
  UserMenuProps,
} from "./types";

interface GrindOlympiadsLayoutProps {
  isStaging: boolean;
  Header: React.ComponentType<HeaderProps>;
  NotificationBell: React.ForwardRefExoticComponent<
    NotificationBellProps & React.RefAttributes<HTMLDivElement>
  >;
  UserMenu: React.ForwardRefExoticComponent<
    UserMenuProps & React.RefAttributes<HTMLDivElement>
  >;
}

const GrindOlympiadsLayout: React.FC<GrindOlympiadsLayoutProps> = ({
  isStaging,
  Header,
  NotificationBell,
  UserMenu,
}) => {
  const { currentUser, login } = useAuth();
  const { notifications, notificationsError, markNotificationAsRead } =
    useNotifications(currentUser);

  const stagingLogin = isStaging ? login : undefined;

  return (
    <div className="flex flex-col h-full">
      <Header
        notifications={notifications}
        notificationsError={notificationsError}
        markNotificationAsRead={markNotificationAsRead}
        stagingLogin={stagingLogin}
        NotificationBell={NotificationBell}
        UserMenu={UserMenu}
      />
      <main className="flex-grow overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default GrindOlympiadsLayout;
