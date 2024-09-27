import type React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import type { Exam } from "../types";

const TestList: React.FC<{ tests: Exam[] }> = ({ tests }) => {
  const { currentUser, isAdminMode } = useAuth();

  if (tests.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-gray-600">No tests found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-2">{test.competition}</h3>
            <p className="text-gray-600 mb-4">{`${test.year} - ${test.name}`}</p>
            <Link
              to={`/exam/${test.id}`}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
            >
              {isAdminMode
                ? "Edit Test"
                : currentUser
                  ? "Take Test"
                  : "View Test"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestList;
