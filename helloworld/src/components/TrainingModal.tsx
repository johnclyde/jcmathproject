import type React from "react";
import type { TrainingModalProps } from "../types";

const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  onTakeExam,
  onStartChallenge,
  onViewPhilosophy,
  exam,
}) => {
  if (!isOpen) return null;

  const isAMCExam = ["AMC-8", "AMC-10", "AMC-12"].includes(exam.examType);
  const isValidYear =
    Number.parseInt(exam.year) >= 2002 && Number.parseInt(exam.year) <= 2023;
  const showHybridChallenges = isAMCExam && isValidYear;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-3xl w-full">
        <h2 className="text-3xl font-bold mb-6">Before You Begin</h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            Training Challenge Option
          </h3>
          <p className="mb-4">
            Our training challenge is designed to help you make informed
            decisions during the actual test. It consists of two parts:
          </p>
          <ol className="list-decimal list-inside mb-4 space-y-2">
            <li>
              <strong>Speedrun:</strong> Attempt all problems, logging the time
              it takes to produce a maybe-correct answer.
            </li>
            <li>
              <strong>Answer Checking:</strong> Simulate effective answer
              checking by doing a second timed run through the same problems
              without consulting your previous calculations.
            </li>
          </ol>
          <p className="mb-4">This exercise will help you gauge:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>How quickly you can work through problems</li>
            <li>Your accuracy under time pressure</li>
            <li>Which problems are worth spending more time on</li>
            <li>
              When to "turn back" and search for mistakes instead of attempting
              harder problems
            </li>
          </ul>
          <p>
            The data collected will help you make informed strategic decisions
            during the actual test.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => onStartChallenge("full")}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition-colors text-lg"
            type="submit"
          >
            Start Training Challenge
          </button>
          <button
            onClick={() => onStartChallenge("firstTen")}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors text-lg"
            type="submit"
          >
            I'll do the First Ten Challenge
          </button>
          {showHybridChallenges && (
            <button
              onClick={() => onStartChallenge("11-15")}
              className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 transition-colors text-lg"
              type="submit"
            >
              I'll do 11-15 from the {exam.year} Exams
            </button>
          )}
          {showHybridChallenges && (
            <button
              onClick={() => onStartChallenge("16-20")}
              className="bg-indigo-500 text-white px-6 py-3 rounded hover:bg-indigo-600 transition-colors text-lg"
              type="submit"
            >
              I'll do 16-20 from the {exam.year} Exams
            </button>
          )}
          <button
            onClick={onTakeExam}
            className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition-colors text-lg"
            type="submit"
          >
            I don't want to train, just give me the test.
          </button>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onViewPhilosophy}
            className="text-blue-500 hover:underline text-lg"
            type="submit"
          >
            View our training philosophy
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
            type="submit"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;
