import type React from "react";
import { useState } from "react";
import type { ProblemReference, TimestampedResponse } from "../types";
import ChallengeStatusPage from "./ChallengeStatusPage";

const ChallengeStatusPageDemo: React.FC = () => {
  const [isChallenge, setIsChallenge] = useState(true);

  // Define the problems for the demo
  const [problems, setProblems] = useState<ProblemReference[]>([
    { problemId: "1", label: "1", examId: "demoExam" },
    { problemId: "2", label: "2", examId: "demoExam" },
    { problemId: "3", label: "3", examId: "demoExam" },
    { problemId: "4", label: "4", examId: "demoExam" },
    { problemId: "5", label: "5", examId: "demoExam" },
    { problemId: "6", label: "6", examId: "demoExam" },
    { problemId: "7", label: "7", examId: "demoExam" },
    { problemId: "8", label: "8", examId: "demoExam" },
    { problemId: "9", label: "9", examId: "demoExam" },
    { problemId: "10", label: "10", examId: "demoExam" },
  ]);

  // Initialize problemResponses
  const [problemResponses, setProblemResponses] = useState<
    Record<string, TimestampedResponse[]>
  >({
    "1": [{ answer: "A", timestamp: Date.now() }],
    "2": [{ answer: "B", timestamp: Date.now() }],
    "3": [],
    "4": [{ answer: "C", timestamp: Date.now() }],
    "5": [
      { answer: "D", timestamp: Date.now() },
      { answer: "E", timestamp: Date.now() + 1000 },
    ],
    "6": [
      { answer: "F", timestamp: Date.now() },
      { answer: "F", timestamp: Date.now() + 1000 },
    ],
    "7": [{ answer: "G", timestamp: Date.now() }],
    "8": [],
    "9": [{ answer: "H", timestamp: Date.now() }],
    "10": [
      { answer: "I", timestamp: Date.now() },
      { answer: "J", timestamp: Date.now() + 1000 },
    ],
  });

  const handleContinue = () => {
    alert("Continuing the challenge/test");
  };

  const handleFinish = () => {
    alert("Finishing the challenge/test");
  };

  const toggleChallengeType = () => {
    setIsChallenge(!isChallenge);
    if (isChallenge) {
      // Adding more problems for full test
      const newProblems = [...problems];
      for (let i = 11; i <= 15; i++) {
        newProblems.push({
          problemId: `${i}`,
          label: `${i}`,
          examId: "demoExam",
        });
      }
      setProblems(newProblems);

      // Initialize responses for new problems
      setProblemResponses((prevResponses) => {
        const newResponses = { ...prevResponses };
        for (let i = 11; i <= 15; i++) {
          newResponses[`${i}`] = [];
        }
        return newResponses;
      });
    } else {
      // Removing problems for ad-hoc challenge
      setProblems((prevProblems) =>
        prevProblems.filter((problem) => Number.parseInt(problem.label) <= 10),
      );

      // Remove responses for removed problems
      setProblemResponses((prevResponses) => {
        const newResponses = { ...prevResponses };
        for (let i = 11; i <= 15; i++) {
          delete newResponses[`${i}`];
        }
        return newResponses;
      });
    }
  };

  const randomizeResponses = () => {
    const statuses = [
      "confirmed",
      "answered",
      "skipped",
      "conflicting",
      "unattempted",
    ];
    const newProblemResponses: Record<string, TimestampedResponse[]> = {};

    for (const problem of problems) {
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      switch (randomStatus) {
        case "confirmed":
          newProblemResponses[problem.label] = [
            { answer: "A", timestamp: Date.now() },
            { answer: "A", timestamp: Date.now() + 1000 },
          ];
          break;
        case "answered":
          newProblemResponses[problem.label] = [
            { answer: "B", timestamp: Date.now() },
          ];
          break;
        case "conflicting":
          newProblemResponses[problem.label] = [
            { answer: "C", timestamp: Date.now() },
            { answer: "D", timestamp: Date.now() + 1000 },
          ];
          break;
        default:
          newProblemResponses[problem.label] = [];
          break;
      }
    }

    setProblemResponses(newProblemResponses);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Challenge Status Page Demo</h1>
      <div className="mb-6 space-y-4">
        <button
          onClick={toggleChallengeType}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          type="button"
        >
          Toggle Challenge Type:{" "}
          {isChallenge ? "Ad Hoc Challenge" : "Full Test"}
        </button>
        <button
          onClick={randomizeResponses}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors ml-4"
          type="button"
        >
          Randomize Responses
        </button>
      </div>
      <ChallengeStatusPage
        problemResponses={problemResponses}
        problems={problems}
        onContinue={handleContinue}
        onFinish={handleFinish}
        isChallenge={isChallenge}
      />
    </div>
  );
};

export default ChallengeStatusPageDemo;
