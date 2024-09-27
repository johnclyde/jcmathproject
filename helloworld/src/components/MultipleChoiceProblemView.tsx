import type React from "react";
import type { ImageData, MultipleChoiceProblemViewProps } from "../types";
import LatexRenderer from "./LatexRenderer";

const MultipleChoiceProblemView: React.FC<MultipleChoiceProblemViewProps> = ({
  problem,
  examId,
  onOptionSelect,
  onSubmit,
  onSkip,
  autoSubmit,
  selectedAnswer,
  responses,
}) => {
  const imageData: ImageData | undefined = problem.image;

  const handleOptionClick = (option: string) => {
    onOptionSelect(option);
    if (autoSubmit) {
      onSubmit(option);
    }
  };

  const getOptionClass = (option: string) => {
    if (!autoSubmit && selectedAnswer === option)
      return "bg-green-200 border-green-500";

    if (responses.length < 2) return "";

    const lastResponse = responses[responses.length - 1];
    const secondLastResponse = responses[responses.length - 2];

    if (
      lastResponse.answer === secondLastResponse.answer &&
      lastResponse.answer === option
    ) {
      return "bg-green-200 border-green-500"; // Confirmed answer
    }
    if (lastResponse.answer === option) {
      return "bg-blue-200 border-blue-500"; // Latest conflicting answer
    }
    if (secondLastResponse.answer === option) {
      return "bg-red-100 border-red-300"; // Previous conflicting answer
    }
    return "";
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <strong className="text-lg">Problem {problem.label}:</strong>
      <div className="mt-2">
        <LatexRenderer latex={problem.statement} />
      </div>
      {imageData && (
        <div className="mt-4 flex justify-center">
          <img
            src={imageData.url}
            alt={imageData.alt}
            width={imageData.width}
            height={imageData.height}
            className="max-w-full h-auto"
            loading="lazy"
          />
        </div>
      )}
      <div className="mt-4">
        {["A", "B", "C", "D", "E"].map((option) => (
          <div key={option} className="flex items-center mb-2">
            <button
              onClick={() => handleOptionClick(option)}
              className={`px-2 py-1 mr-2 border rounded focus:outline-none focus:ring ${getOptionClass(
                option,
              )} hover:bg-gray-100 focus:border-blue-300`}
              type="submit"
            >
              ({option})
            </button>
            <LatexRenderer latex={`$${problem.options[option] || ""}$`} />
          </div>
        ))}
        {!autoSubmit && (
          <button
            onClick={() => selectedAnswer && onSubmit(selectedAnswer)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!selectedAnswer}
            type="submit"
          >
            Submit Answer
          </button>
        )}
      </div>
      <button
        onClick={onSkip}
        className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
        type="submit"
      >
        Skip
      </button>
    </div>
  );
};

export default MultipleChoiceProblemView;
