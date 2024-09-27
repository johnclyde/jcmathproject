import type React from "react";
import type {
  ChallengeStatusPageProps,
  ProblemReference,
  ProblemStatus,
  TimestampedResponse,
} from "../types";

const ChallengeStatusPage: React.FC<ChallengeStatusPageProps> = ({
  problemResponses,
  problems,
  onContinue,
  onFinish,
  isChallenge,
}) => {
  // Function to determine the status of each problem based on problemResponses
  const getProblemStatus = (
    responses: TimestampedResponse[] | undefined,
  ): ProblemStatus => {
    if (!responses || responses.length === 0) {
      return "unattempted";
    }
    if (responses.length === 1) {
      return "answered";
    }

    const lastAnswer = responses[responses.length - 1].answer;
    const secondLastAnswer = responses[responses.length - 2].answer;
    if (lastAnswer === secondLastAnswer) {
      return "confirmed";
    }
    return "conflicting";
  };

  // Generate problemStatuses based on problemResponses
  const problemStatuses: Record<string, ProblemStatus> = {};
  for (const problem of problems) {
    const responses = problemResponses[problem.label];
    problemStatuses[problem.label] = getProblemStatus(responses);
  }

  // Check if all problems are confirmed
  const allConfirmed = Object.values(problemStatuses).every(
    (status) => status === "confirmed",
  );

  // Function to get the color based on the problem status
  const getStatusColor = (status: ProblemStatus) => {
    switch (status) {
      case "answered":
        return "bg-blue-500";
      case "confirmed":
        return "bg-green-500";
      case "skipped":
        return "bg-yellow-500";
      case "conflicting":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {isChallenge ? "Challenge Status" : "Test Status"}
      </h2>
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {problems.map((problem) => {
          const status = problemStatuses[problem.label];
          return (
            <div key={problem.label} className="text-center">
              <div
                className={`w-10 h-10 rounded-full ${getStatusColor(
                  status,
                )} flex items-center justify-center text-white font-bold`}
              >
                {problem.label}
              </div>
              <div className="mt-1 text-xs">{status}</div>
            </div>
          );
        })}
      </div>
      {isChallenge ? (
        allConfirmed ? (
          <>
            <p className="mb-4 font-semibold text-center">
              Congratulations! You have completed the Challenge.
            </p>
            <div className="flex justify-center">
              <button
                onClick={onFinish}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
                type="submit"
              >
                Finish and Return to Home
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-center">
              You still have some questions to confirm or answer. Would you like
              to continue?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onContinue}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                type="submit"
              >
                Continue Challenge
              </button>
              <button
                onClick={onFinish}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                type="submit"
              >
                Finish Anyway
              </button>
            </div>
          </>
        )
      ) : (
        <>
          <p className="mb-4 text-center">
            You have reached the end of the test.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onContinue}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              type="submit"
            >
              Review Test
            </button>
            <button
              onClick={onFinish}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
              type="submit"
            >
              Finish Test
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChallengeStatusPage;
