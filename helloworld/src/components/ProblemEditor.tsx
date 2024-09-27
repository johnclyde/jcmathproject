import type React from "react";
import { useState } from "react";
import type { ProblemDetails, ProblemEditorProps } from "../types";
import LatexRenderer from "./LatexRenderer";
import ProblemForm from "./ProblemForm";

const ProblemEditor: React.FC<ProblemEditorProps> = ({
  problem,
  problemLabel,
  onSave,
  onCancel,
}) => {
  const [editedProblem, setEditedProblem] = useState<ProblemDetails>(problem);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedProblem);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="problemLabel" className="block font-bold mb-1">
          Problem Number
        </label>
        <input
          type="text"
          id="problemLabel"
          name="problemLabel"
          value={problemLabel}
          readOnly
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>

      <ProblemForm problem={editedProblem} onChange={setEditedProblem} />

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
          Save Changes
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-bold mb-2">Preview:</h3>
        <div className="p-4 border rounded">
          <LatexRenderer latex={editedProblem.statement} />
          {editedProblem.image && (
            <img
              src={editedProblem.image.url}
              alt={editedProblem.image.alt}
              className="mt-2 max-w-full h-auto"
            />
          )}
          {editedProblem.type === "multiple_choice" && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Options:</h4>
              {Object.entries(editedProblem.options).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="font-bold mr-2">{key}:</span>
                  <LatexRenderer latex={`$${value}$`} />
                </div>
              ))}
              <p className="mt-2">
                <strong>Correct Answer:</strong> {editedProblem.correctAnswer}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProblemEditor;
