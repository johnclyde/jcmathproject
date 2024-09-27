import type React from "react";
import type {
  ProblemNavigationProps,
  ProblemTimer,
  TimestampedResponse,
} from "../types";

const ProblemNavigation: React.FC<ProblemNavigationProps> = ({
  problems,
  currentIndex,
  onNavigate,
  responses,
  problemTimers,
  totalTimePaused,
  visitedProblems,
}) => {
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getButtonColor = (problemResponses: TimestampedResponse[]) => {
    if (problemResponses.length === 0) return "bg-gray-300"; // unattempted
    if (problemResponses.length === 1) return "bg-blue-500"; // answered

    const lastResponse = problemResponses[problemResponses.length - 1];
    const secondLastResponse = problemResponses[problemResponses.length - 2];

    if (lastResponse.answer === secondLastResponse.answer) {
      return "bg-green-500";
    }
    return "bg-red-500"; // conflicting
  };

  const CrossedOutPauseSymbol = () => (
    <svg
      viewBox="0 0 100 100"
      className="w-8 h-8"
      aria-labelledby="pauseIconTitle"
    >
      <title id="pauseIconTitle">Time Paused</title>
      <rect x="30" y="25" width="15" height="50" fill="#9E9E9E" />
      <rect x="55" y="25" width="15" height="50" fill="#9E9E9E" />
      <line
        x1="20"
        y1="80"
        x2="80"
        y2="20"
        stroke="#757575"
        strokeWidth="6"
        opacity="0.6"
      />
    </svg>
  );

  const shouldShowPauseButton = totalTimePaused >= 10000; // 10 seconds

  return (
    <div className="flex flex-wrap justify-center space-x-2 mb-4">
      {problems.map((problem, i) => {
        const problemResponses = responses[problem.label] || [];
        const buttonColor = getButtonColor(problemResponses);
        const timer = problemTimers[problem.label];

        return (
          <div
            key={problem.problemId}
            className="flex flex-col items-center m-1"
          >
            <button
              className={`w-12 h-12 rounded-full ${buttonColor} ${
                i === currentIndex ? "ring-2 ring-offset-2 ring-black" : ""
              } flex items-center justify-center text-white font-bold`}
              onClick={() => onNavigate(i)}
              disabled={i === currentIndex}
              type="submit"
            >
              {problem.label}
            </button>
            {visitedProblems[i] && timer && (
              <div className="text-xs mt-1">
                {timer.firstTimer > 0 && (
                  <div>{formatTime(timer.firstTimer)}</div>
                )}
                {timer.firstTimerLocked && timer.secondTimer > 0 && (
                  <div>{formatTime(timer.secondTimer)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {shouldShowPauseButton && (
        <div className="flex flex-col items-center m-1">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <CrossedOutPauseSymbol />
          </div>
          <div className="text-xs mt-1">{formatTime(totalTimePaused)}</div>
        </div>
      )}
    </div>
  );
};

export default ProblemNavigation;
