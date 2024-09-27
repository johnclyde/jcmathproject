import {
  Calculator,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  List,
  Monitor,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

const questions = [
  {
    id: 1,
    text: "Two lines with slopes 1/3 and 2 intersect at (2,2). What is the area of the triangle enclosed by these two lines and the line x + y = 10?",
    options: [
      { id: "A", text: "4" },
      { id: "B", text: "4√2" },
      { id: "C", text: "6" },
      { id: "D", text: "8" },
      { id: "E", text: "6√2" },
    ],
    correctAnswer: "C",
    explanation:
      "To solve this, we need to find the points where the lines intersect. We already know one point (2,2). The line x + y = 10 intersects with y = 1/3x + 4/3 at (5,5) and with y = 2x - 2 at (4,6). Now we have a triangle with vertices at (2,2), (5,5), and (4,6). Using the formula Area = |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)| / 2, we get Area = |2(5-6) + 5(6-2) + 4(2-5)| / 2 = |-2 + 20 - 12| / 2 = 6.",
  },
  // ... (other questions remain the same)
];

const AdvancedTestInterface: React.FC<{ testName?: string }> = ({
  testName = "Advanced Mathematics Test",
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    setStartTime(new Date());
  }, []);

  const handleSelectAnswer = (questionId: number, answerId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = () => {
    setEndTime(new Date());
    setShowResults(true);
  };

  const calculateStats = () => {
    const score = questions.filter(
      (q) => answers[q.id] === q.correctAnswer,
    ).length;
    const totalQuestions = questions.length;
    const accuracy = (score / totalQuestions) * 100;
    const timeTaken =
      endTime && startTime ? endTime.getTime() - startTime.getTime() : 0;
    const minutes = Math.floor(timeTaken / 60000);
    const seconds = ((timeTaken % 60000) / 1000).toFixed(0);

    return {
      score,
      totalQuestions,
      accuracy: accuracy.toFixed(2),
      timeTaken: `${minutes}:${seconds.padStart(2, "0")}`,
      correctAnswers: score,
      incorrectAnswers: totalQuestions - score,
    };
  };

  const toggleExplanation = (questionId: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const renderQuestion = (question: (typeof questions)[0]) => (
    <div key={question.id} className="mb-8 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">
        {question.id}. {question.text}
      </h2>
      <div className="grid grid-cols-1 gap-2 mb-4">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelectAnswer(question.id, option.id)}
            className={`text-left p-2 border rounded hover:bg-gray-100 ${
              answers[question.id] === option.id
                ? "bg-blue-100 border-blue-500"
                : ""
            }`}
            type="submit"
          >
            ({option.id}) {option.text}
          </button>
        ))}
      </div>
    </div>
  );

  const renderResults = () => {
    const stats = calculateStats();

    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Test Results</h2>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <p className="text-xl font-bold">
              Score: {stats.score} / {stats.totalQuestions}
            </p>
            <p className="text-lg">Accuracy: {stats.accuracy}%</p>
            <p className="text-lg">Time Taken: {stats.timeTaken}</p>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-4">Question Breakdown</h3>
        {questions.map((question) => (
          <div
            key={question.id}
            className="mb-4 p-4 bg-white shadow rounded text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Question {question.id}:</span>
              {answers[question.id] === question.correctAnswer ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
            </div>
            <p className="mb-2">{question.text}</p>
            <p className="mb-2">
              Your answer:{" "}
              {
                question.options.find((opt) => opt.id === answers[question.id])
                  ?.text
              }
            </p>
            <p className="mb-2">
              Correct answer:{" "}
              {
                question.options.find(
                  (opt) => opt.id === question.correctAnswer,
                )?.text
              }
            </p>
            <button
              onClick={() => toggleExplanation(question.id)}
              className="flex items-center justify-center w-full p-2 bg-gray-100 hover:bg-gray-200 rounded"
              type="submit"
            >
              {expandedExplanations[question.id] ? (
                <>
                  Hide Explanation <ChevronUp className="ml-2" size={20} />
                </>
              ) : (
                <>
                  Show Explanation <ChevronDown className="ml-2" size={20} />
                </>
              )}
            </button>
            {expandedExplanations[question.id] && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Side panel for tools */}
      <div className="w-64 bg-white p-4 shadow-md">
        <h2 className="text-xl font-bold mb-4">Tools</h2>
        <button
          className="flex items-center w-full p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200"
          type="submit"
        >
          <Calculator className="mr-2" size={20} />
          Calculator
        </button>
        <button
          className="flex items-center w-full p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200"
          type="submit"
        >
          <Edit3 className="mr-2" size={20} />
          Sketchpad
        </button>
      </div>
      {/* Main content area */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{testName}</h1>
            {!showResults && (
              <button
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                type="submit"
              >
                {showAllQuestions ? (
                  <Monitor className="mr-2" size={20} />
                ) : (
                  <List className="mr-2" size={20} />
                )}
                {showAllQuestions ? "Show One" : "Show All"}
              </button>
            )}
          </div>

          {!showResults ? (
            <>
              {showAllQuestions
                ? questions.map(renderQuestion)
                : renderQuestion(questions[currentQuestion])}
              {!showAllQuestions && (
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() =>
                      setCurrentQuestion((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                    type="submit"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(questions.length - 1, prev + 1),
                      )
                    }
                    disabled={currentQuestion === questions.length - 1}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                    type="submit"
                  >
                    Next
                  </button>
                </div>
              )}
              <button
                onClick={handleSubmit}
                className="mt-8 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                type="submit"
              >
                Submit Test
              </button>
            </>
          ) : (
            renderResults()
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTestInterface;
