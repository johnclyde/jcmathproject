import type React from "react";
import { useState } from "react";
import type { AMCProblemDetails as AMCProblem } from "../types";
import ProblemEditor from "./ProblemEditor";

const initialProblem: AMCProblem = {
  statement: `Solve the equation:

\\[x^2 + 4x + 4 = 0\\]

What is the value of $x$?

\\[ \\]

Explain your reasoning using the quadratic formula:

\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]

where $ a = 1, b = 4, \\text{ and } c = 4 $.`,
  type: "multiple_choice",
  options: {
    A: "$x = -2$",
    B: "$x = 2$",
    C: "$x = \\pm 2$",
    D: "$x = -2 \\pm 2i$",
    E: "The equation has no solution",
  },
  correctAnswer: "A",
};

const ProblemEditorDemo: React.FC = () => {
  const [problem, setProblem] = useState(initialProblem);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedProblem: AMCProblem) => {
    setProblem(updatedProblem);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Problem Editor Demo</h1>
      {isEditing ? (
        <ProblemEditor
          problem={problem}
          problemLabel={"1"}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <div>
          <ProblemEditor
            problem={problem}
            problemLabel={"1"}
            onSave={() => {}}
            onCancel={() => {}}
          />
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            type="submit"
          >
            Edit Problem
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemEditorDemo;
