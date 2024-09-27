import type React from "react";
import { useState } from "react";

interface AnswerSubmissionFormProps {
  onSubmit: (answer: string) => void;
}

const AnswerSubmissionForm: React.FC<AnswerSubmissionFormProps> = ({
  onSubmit,
}) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer(""); // Clear the input after submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer"
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Submit Answer
      </button>
    </form>
  );
};

export default AnswerSubmissionForm;
