import type React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface UserStatsProps {
  user: {
    id: string;
    name: string;
    email: string;
    problemsSolved: number;
    testsCompleted: number;
    averageScore: number;
    testScores: Array<{ name: string; score: number }>;
  };
}

const UserStats: React.FC<UserStatsProps> = ({ user }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Problems Solved</h3>
          <p className="text-3xl font-bold text-blue-600">
            {user.problemsSolved}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Tests Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {user.testsCompleted}
          </p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {user.averageScore}%
          </p>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Test Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={user.testScores}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          type="submit"
        >
          Take Another Test
        </button>
      </div>
    </div>
  );
};

export default UserStats;
