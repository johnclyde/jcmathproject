import type React from "react";
import type { UserProgress as UserProgressType } from "../types";

interface UserProgressProps {
  userProgress: UserProgressType[];
}

const UserProgress: React.FC<UserProgressProps> = ({ userProgress }) => {
  if (!userProgress || userProgress.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            You haven&apos;t completed any tests yet. Start taking tests to see
            your progress!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Completed Tests</h3>
        <ul className="space-y-2">
          {userProgress.map((progress) => (
            <li
              key={`${progress.testId}-${progress.completedAt}`}
              className="flex justify-between items-center border-b border-gray-200 py-2 last:border-b-0"
            >
              <span className="text-gray-700">{`${progress.testId} ${progress.completedAt}`}</span>
              <span className="text-blue-600 font-semibold">{`Score: ${progress.score}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProgress;
