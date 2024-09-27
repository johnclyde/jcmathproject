import type React from "react";
import { Link } from "react-router-dom";
import useChallenges from "../hooks/useChallenges";

const Challenges: React.FC = () => {
  const { challenges, loading, error } = useChallenges();

  if (loading) {
    return <div>Loading challenges...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Challenges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-2">{challenge.name}</h3>
            <p className="text-gray-600 mb-4">{challenge.description}</p>
            <p className="mb-2">Source: {challenge.sourceExam}</p>
            <p className="mb-2">Problems: {challenge.problems.join(", ")}</p>
            <p className="mb-4">Max Score: {challenge.maxScore}</p>

            {challenge.userProgress ? (
              <div>
                <p className="font-bold">Your Progress:</p>
                <p>
                  Score: {challenge.userProgress.score} / {challenge.maxScore}
                </p>
                <p>
                  Completed:{" "}
                  {new Date(
                    challenge.userProgress.completedAt,
                  ).toLocaleString()}
                </p>
              </div>
            ) : (
              <Link
                to={`/challenge/${challenge.id}`}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Start Challenge
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;
