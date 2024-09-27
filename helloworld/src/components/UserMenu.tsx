import { GoogleLogin } from "@react-oauth/google";
import { forwardRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserMenuProps } from "../types";

const UserMenu = forwardRef<HTMLDivElement, UserMenuProps>(
  (
    {
      user,
      userProfile,
      showUserMenu,
      setShowUserMenu,
      login,
      logout,
      isAdminMode,
      toggleAdminMode,
      stagingLogin,
    },
    ref,
  ) => {
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const navigate = useNavigate();

    const handleSettingsClick = () => {
      setShowUserMenu(false);
      console.log("Navigate to settings");
    };

    const handleLogout = () => {
      setShowUserMenu(false);
      logout();
    };

    const handleLoginClick = () => {
      setShowUserMenu(false);
      setShowLoginDialog(true);
    };

    const handleToggleAdminMode = () => {
      toggleAdminMode();
      setShowUserMenu(false);
    };

    const handleUsersClick = () => {
      setShowUserMenu(false);
      navigate("/admin/users");
    };

    const handleAdminActionsClick = () => {
      setShowUserMenu(false);
      navigate("/admin/actions");
    };

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded-full"
          aria-label="User menu"
          type="submit"
        >
          {user ? (
            <img
              src={user?.photoURL || "/default-avatar.png"}
              alt={user?.displayName || "User"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>User icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </button>
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSettingsClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  type="submit"
                >
                  Settings
                </button>
                {userProfile?.isAdmin && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    {isAdminMode && (
                      <>
                        <button
                          onClick={handleUsersClick}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          type="submit"
                        >
                          Users
                        </button>
                        <button
                          onClick={handleAdminActionsClick}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          type="submit"
                        >
                          Recorded Actions
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleToggleAdminMode}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      type="submit"
                    >
                      {isAdminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
                    </button>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  type="submit"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  type="submit"
                >
                  Login
                </button>
                {stagingLogin && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      stagingLogin();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    type="submit"
                  >
                    Log in as math1434
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {showLoginDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Login</h2>
              <GoogleLogin
                onSuccess={() => {
                  login();
                  setShowLoginDialog(false);
                }}
                onError={() => {
                  console.log("Login Failed");
                  setShowLoginDialog(false);
                }}
              />
              <button
                onClick={() => setShowLoginDialog(false)}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                type="submit"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

UserMenu.displayName = "UserMenu";

export default UserMenu;
