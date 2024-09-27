import type React from "react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const UserProfile: React.FC = () => {
  const { userProfile, profileError, profileLoading, refreshUserProfile } =
    useAuth();

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  if (profileLoading) {
    return <div>Loading profile...</div>;
  }

  if (profileError) {
    return <div className="text-red-500">Error: {profileError}</div>;
  }

  if (!userProfile) {
    return <div>No profile data available.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
        <div className="mb-4">
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="w-24 h-24 rounded-full mx-auto"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="name"
          >
            Name
          </label>
          <p className="text-gray-700" id="name">
            {userProfile.name}
          </p>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <p className="text-gray-700" id="email">
            {userProfile.email}
          </p>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="role"
          >
            Role
          </label>
          <p className="text-gray-700" id="role">
            {userProfile.role}
          </p>
        </div>
        {userProfile.isAdmin && (
          <div className="mb-4">
            <p className="text-green-500 font-bold">Admin</p>
          </div>
        )}
        {userProfile.isStaff && (
          <div className="mb-4">
            <p className="text-blue-500 font-bold">Staff</p>
          </div>
        )}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="points"
          >
            Points
          </label>
          <p className="text-gray-700" id="points">
            {userProfile.points}
          </p>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="created-at"
          >
            Account Created
          </label>
          <p className="text-gray-700" id="created-at">
            {new Date(userProfile.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="last-login"
          >
            Last Login
          </label>
          <p className="text-gray-700" id="last-login">
            {new Date(userProfile.lastLogin).toLocaleString()}
          </p>
        </div>
        {userProfile.testsTaken && userProfile.testsTaken.length > 0 && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="tests-taken"
            >
              Tests Taken
            </label>
            <ul className="list-disc list-inside" id="tests-taken">
              {userProfile.testsTaken.map((test) => (
                <li key={test} className="text-gray-700">
                  {test}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
