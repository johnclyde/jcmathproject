import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import useExamNavigation from "../hooks/useExamNavigation";
import {
  type ExamContentProps,
  type ProblemDetails,
  type ProblemReference,
  isAMCProblem,
} from "../types";
import ChallengeStatusPage from "./ChallengeStatusPage";
import MultipleChoiceProblemView from "./MultipleChoiceProblemView";
import ProblemNavigation from "./ProblemNavigation";
import ProblemView from "./ProblemView";

const ExamContent: React.FC<ExamContentProps> = ({
  exam,
  challengeRun,
  challengeProblems,
  onFinish,
}) => {
  const [showActionLog, setShowActionLog] = useState(false);

  const {
    currentProblemIndex,
    problemResponses,
    selectedAnswers,
    problemTimers,
    totalTimePaused,
    visitedProblems,
    pauseAfterSubmission,
    setPauseAfterSubmission,
    autoSubmit,
    setAutoSubmit,
    isPaused,
    actionLog,
    problems,
    navigateToProblem,
    handleAnswer,
    handleOptionSelect,
    handleSkip,
    handleContinue,
    showAllProblems,
    toggleShowAllProblems,
    isComplete,
    setIsComplete,
    handlePrevious,
    handleNext,
    canNavigatePrevious,
    canNavigateNext,
  } = useExamNavigation(challengeRun, challengeProblems);

  useEffect(() => {
    console.log("ExamContent State:", {
      currentProblemIndex,
      problemResponses,
      problemTimers,
      visitedProblems,
      challengeType: challengeRun.challenge.type,
      problems: challengeProblems,
    });
  }, [
    currentProblemIndex,
    problemResponses,
    problemTimers,
    visitedProblems,
    challengeRun,
    challengeProblems,
  ]);

  const renderProblem = (problem: ProblemReference & ProblemDetails) => {
    if (isAMCProblem(problem)) {
      return (
        <MultipleChoiceProblemView
          problem={problem}
          examId={exam.id}
          onOptionSelect={(answer) => handleOptionSelect(problem.label, answer)}
          onSubmit={handleAnswer}
          onSkip={handleSkip}
          autoSubmit={autoSubmit}
          selectedAnswer={selectedAnswers[problem.label] || null}
          responses={problemResponses[problem.label] || []}
        />
      );
    }
    return (
      <ProblemView
        problem={problem}
        examId={exam.id}
        onAnswerSubmit={handleAnswer}
        onSkip={handleSkip}
        currentAnswer={selectedAnswers[problem.label] || ""}
      />
    );
  };

  const formatChallengeStartTime = (startTime: string) => {
    const startDate = new Date(startTime);
    const now = new Date();
    const timeString = startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (startDate.toDateString() === now.toDateString()) {
      return `Started at ${timeString}`;
    }
    const dateString = startDate.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    return `Started at ${timeString} on ${dateString}`;
  };

  const renderChallengeType = () => {
    const challengeType = challengeRun.challenge.type;
    const displayType =
      challengeType === "11-15" || challengeType === "16-20"
        ? `${challengeType} Challenge`
        : `${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)} Challenge`;

    return (
      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
        <div>{displayType}</div>
        <div className="text-xs mt-1">
          {formatChallengeStartTime(challengeRun.startedAt)}
        </div>
      </div>
    );
  };

  const renderActionLog = () => (
    <>
      <button
        onClick={() => setShowActionLog(!showActionLog)}
        className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded"
        type="submit"
      >
        {showActionLog ? "Hide Action Log" : "Show Action Log"}
      </button>
      {showActionLog && (
        <div className="mt-4 p-4 border rounded max-h-60 overflow-y-auto">
          <h3 className="font-bold mb-2">Action Log:</h3>
          {actionLog.map((action) => (
            <div key={`action-${action.timestamp}`} className="mb-2">
              <span className="font-semibold">{action.type}</span> -{" "}
              {action.timestamp} - Problem: {action.problemLabel || "N/A"}
              {action.data && (
                <span> - Data: {JSON.stringify(action.data)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (isComplete) {
    return (
      <ChallengeStatusPage
        problemResponses={problemResponses}
        problems={problems}
        onContinue={() => setIsComplete(false)}
        onFinish={onFinish}
        isChallenge={challengeRun.challenge !== null}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        {challengeRun.challenge.type === "full" && (
          <button
            onClick={toggleShowAllProblems}
            className="bg-green-500 text-white px-4 py-2 rounded"
            type="submit"
          >
            {showAllProblems ? "Show One Problem" : "Show All Problems"}
          </button>
        )}
        <div>
          <label className="flex items-center mr-4">
            <input
              type="checkbox"
              checked={pauseAfterSubmission}
              onChange={() => setPauseAfterSubmission(!pauseAfterSubmission)}
              className="mr-2"
            />
            Pause after submission
          </label>
          {!showAllProblems && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={() => setAutoSubmit(!autoSubmit)}
                className="mr-2"
              />
              Auto-submit and move to next problem
            </label>
          )}
        </div>
        {renderChallengeType()}
      </div>
      <ProblemNavigation
        problems={problems}
        currentIndex={currentProblemIndex}
        onNavigate={navigateToProblem}
        responses={problemResponses}
        problemTimers={problemTimers}
        totalTimePaused={totalTimePaused}
        visitedProblems={visitedProblems}
      />
      {isPaused ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Paused</h2>
          <p className="mb-4">
            The timers are paused. You are heavily discouraged from working on
            the problems until things resume.
          </p>
          <button
            onClick={handleContinue}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            type="submit"
          >
            View Next Problem And Restart Timers
          </button>
        </div>
      ) : showAllProblems && challengeRun.challenge.type === "full" ? (
        <ul className="space-y-4">
          {problems.map((problem) => (
            <li key={problem.problemId}>
              {renderProblem(problem as ProblemReference & ProblemDetails)}
            </li>
          ))}
        </ul>
      ) : (
        <div>
          {renderProblem(
            problems[currentProblemIndex] as ProblemReference & ProblemDetails,
          )}
          {challengeRun.challenge.type === "full" && (
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevious}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                disabled={!canNavigatePrevious}
                type="submit"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                disabled={!canNavigateNext}
                type="submit"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      )}
      {renderActionLog()}
    </div>
  );
};

export default ExamContent;
