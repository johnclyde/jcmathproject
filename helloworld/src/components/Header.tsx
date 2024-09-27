import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { HeaderProps } from "../types";

const Header: React.FC<HeaderProps> = ({
  notifications,
  notificationsError,
  markNotificationAsRead,
  NotificationBell,
  UserMenu,
  stagingLogin,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isLabsPath = location.pathname.startsWith("/labs");

  const {
    currentUser,
    userProfile,
    login,
    logout,
    isAdminMode,
    toggleAdminMode,
  } = useAuth();

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target as Node)
    ) {
      setShowNotifications(false);
    }
    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target as Node)
    ) {
      setShowUserMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const headerBackgroundColor = isAdminMode ? "bg-red-900" : "bg-gray-800";

  return (
    <header
      className={`${headerBackgroundColor} text-white p-4 sticky top-0 z-50 w-full`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          GrindOlympiads
        </Link>
        <div className="flex items-center space-x-4">
          {isLabsPath && (
            <Link to="/labs" className="text-white hover:text-gray-300">
              Components Directory
            </Link>
          )}
          {currentUser ? (
            <>
              <NotificationBell
                ref={notificationRef}
                notifications={notifications}
                notificationsError={notificationsError}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                markNotificationAsRead={markNotificationAsRead}
              />
              <UserMenu
                ref={userMenuRef}
                user={currentUser}
                userProfile={userProfile}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                login={login}
                logout={logout}
                isAdminMode={isAdminMode}
                toggleAdminMode={toggleAdminMode}
                stagingLogin={stagingLogin}
              />
            </>
          ) : (
            <button
              onClick={login}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              type="submit"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
