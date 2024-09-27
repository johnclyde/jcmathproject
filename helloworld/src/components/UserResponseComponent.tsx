import { getFunctions, httpsCallable } from "firebase/functions";
import type React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getIdToken } from "../firebase";
import LatexRenderer from "./LatexRenderer";

interface OptionButtonProps {
  option: string;
  selected: boolean;
  onClick: () => void;
  latex: string;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  selected,
  onClick,
  latex,
}) => (
  <button
    onClick={onClick}
    className={`p-2 m-1 border rounded ${selected ? "bg-green-200" : "bg-white"}`}
    type="submit"
  >
    {option}. <LatexRenderer latex={latex} />
  </button>
);

interface Problem {
  id: string;
  number: number;
  question: string;
  options: Record<string, string>;
}

interface MultipleChoiceProblemProps {
  problem: Problem;
  onAnswer: (problemId: string, option: string) => void;
  userResponse: string | null;
}

const MultipleChoiceProblem: React.FC<MultipleChoiceProblemProps> = ({
  problem,
  onAnswer,
  userResponse,
}) => {
  const handleOptionClick = (option: string) => {
    onAnswer(problem.id, option);
  };

  const options = ["A", "B", "C", "D", "E"];

  return (
    <div className="mb-6">
      <h3 className="font-bold mb-2">Problem {problem.number}</h3>
      <LatexRenderer latex={problem.question} />
      <div className="mt-2">
        {options.map((option) => (
          <OptionButton
            key={option}
            option={option}
            selected={userResponse === option}
            onClick={() => handleOptionClick(option)}
            latex={problem.options[option]}
          />
        ))}
      </div>
    </div>
  );
};

interface Exam {
  id: string;
  title: string;
  problems: Problem[];
  isMultipleChoice: boolean;
}

const UserResponseComponent: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [responses, setResponses] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const functions = getFunctions();
        const getExam = httpsCallable(functions, "getExam");
        const idToken = await getIdToken();

        const result = await getExam({ examId, idToken });
        const examData = result.data as Exam;

        setExam(examData);

        const initialResponses = examData.problems.reduce(
          (acc, problem) => {
            acc[problem.id] = null;
            return acc;
          },
          {} as Record<string, string | null>,
        );
        setResponses(initialResponses);

        setError(null);
      } catch (error) {
        console.error("Error fetching exam:", error);
        setError("Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleAnswer = async (problemId: string, answer: string) => {
    setResponses((prev) => ({ ...prev, [problemId]: answer }));

    try {
      const functions = getFunctions();
      const submitAnswer = httpsCallable(functions, "submitAnswer");
      const idToken = await getIdToken();

      await submitAnswer({
        examId,
        problemId,
        answer,
        idToken,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading exam data...</div>;
  }

  if (error) {
    return <div className="p4 text-center text-red-500">{error}</div>;
  }

  if (!exam) {
    return <div>No exam data available.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{exam.title}</h2>
      {exam.isMultipleChoice ? (
        exam.problems.map((problem) => (
          <MultipleChoiceProblem
            key={problem.id}
            problem={problem}
            onAnswer={handleAnswer}
            userResponse={responses[problem.id]}
          />
        ))
      ) : (
        // Render non-multiple choice problems here
        <div>Non-multiple choice problems not implemented yet</div>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">Your Responses</h3>
        <ul>
          {Object.entries(responses).map(([problemId, answer]) => (
            <li key={problemId}>
              Problem {exam.problems.find((p) => p.id === problemId)?.number}:{" "}
              {answer || "Not answered"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserResponseComponent;
