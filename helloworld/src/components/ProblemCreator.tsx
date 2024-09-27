import type React from "react";
import { useState } from "react";
import type { AMCProblemDetails, ProblemDetails } from "../types";
import ProblemForm from "./ProblemForm";

interface ProblemCreatorProps {
  onSave: (problem: ProblemDetails, label: string) => void;
  onCancel: () => void;
  suggestedLabel?: string;
}

const ProblemCreator: React.FC<ProblemCreatorProps> = ({
  onSave,
  onCancel,
  suggestedLabel = "",
}) => {
  const [problem, setProblem] = useState<ProblemDetails>({
    type: "multiple_choice",
    statement: "",
    options: { A: "", B: "", C: "", D: "", E: "" },
    correctAnswer: "",
  } as AMCProblemDetails);
  const [label, setLabel] = useState(suggestedLabel);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(problem, label);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="problemLabel" className="block font-bold mb-1">
          Problem Label (Number)
        </label>
        <input
          type="text"
          id="problemLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., 15 or 2-A"
          required
        />
      </div>
      <ProblemForm problem={problem} onChange={setProblem} />
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create Problem
        </button>
      </div>
    </form>
  );
};

export default ProblemCreator;
