import type React from "react";
import { useState } from "react";
import type { ProblemDetails } from "../types";
import LatexRenderer from "./LatexRenderer";

interface ProblemFormProps {
  problem: ProblemDetails;
  onChange: (updatedProblem: ProblemDetails) => void;
}

const ProblemForm: React.FC<ProblemFormProps> = ({ problem, onChange }) => {
  const [suggestedOptions, setSuggestedOptions] = useState<
    Record<string, string>
  >({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    onChange({ ...problem, [name]: value });
  };

  const parseOptions = (input: string): Record<string, string> => {
    const cleanedInput = input.replace(/^\s*\$|\$\s*$/g, "").trim();
    const parts = cleanedInput.split(/\\qquad|\n/).filter(Boolean);
    const parsedOptions: Record<string, string> = {};

    for (const part of parts) {
      const match = part.match(/\\(text|textbf){\(([A-E])\)}(.+)/);
      if (match) {
        const [, , key, value] = match;
        parsedOptions[key] = value.trim().replace(/^\\\s/, "");
      }
    }

    return parsedOptions;
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newOptionsText = e.target.value;
    const newSuggestedOptions = parseOptions(newOptionsText);

    setSuggestedOptions(newSuggestedOptions);
    setShowSuggestions(Object.keys(newSuggestedOptions).length > 0);
  };

  const applyAllModifications = () => {
    onChange({ ...problem, options: suggestedOptions });
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="type" className="block font-bold mb-1">
          Problem Type
        </label>
        <select
          id="type"
          name="type"
          value={problem.type}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
        </select>
      </div>
      <div>
        <label htmlFor="statement" className="block font-bold mb-1">
          Problem Statement
        </label>
        <textarea
          id="statement"
          name="statement"
          value={problem.statement}
          onChange={handleInputChange}
          rows={5}
          className="w-full p-2 border rounded"
        />
      </div>
      {problem.type === "multiple_choice" && (
        <div>
          <label htmlFor="options" className="block font-bold mb-1">
            Options (A-E, one per line or LaTeX format)
          </label>
          <textarea
            id="options"
            name="options"
            defaultValue={Object.entries(problem.options)
              .map(([key, value]) => value)
              .join("\n")}
            onChange={handleOptionsChange}
            rows={5}
            className="w-full p-2 border rounded font-mono"
            placeholder="\\textbf{(A)} 0
\\textbf{(B)} \\frac{1}{x}
\\textbf{(C)} \\sqrt{x}
\\textbf{(D)} x^2 + 2x + 1
\\textbf{(E)} \\frac{x^2 + x}{2}"
          />
          {showSuggestions && (
            <div className="mt-2">
              <h4 className="font-bold">Suggested Options:</h4>
              {Object.entries(suggestedOptions).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="font-semibold mr-2">{key}:</span>
                  <LatexRenderer latex={value} />
                </div>
              ))}
              <button
                onClick={applyAllModifications}
                className="mt-2 p-2 bg-blue-500 text-white rounded"
                type="submit"
              >
                Apply Suggestions
              </button>
            </div>
          )}
          <div>
            <label htmlFor="correctAnswer" className="block font-bold mb-1">
              Correct Answer
            </label>
            <select
              id="correctAnswer"
              name="correctAnswer"
              value={problem.correctAnswer}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select correct answer</option>
              {Object.keys(problem.options).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {problem.type === "short_answer" && (
        <div>
          <label htmlFor="correctAnswer" className="block font-bold mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            id="correctAnswer"
            name="correctAnswer"
            value={problem.correctAnswer}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
      {problem.type === "essay" && (
        <div>
          <label htmlFor="solutionGuidelines" className="block font-bold mb-1">
            Solution Guidelines
          </label>
          <textarea
            id="solutionGuidelines"
            name="solutionGuidelines"
            value={problem.solutionGuidelines || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
    </div>
  );
};

export default ProblemForm;
