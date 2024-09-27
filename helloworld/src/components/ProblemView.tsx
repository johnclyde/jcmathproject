import type React from "react";
import type { ImageData, ProblemViewProps } from "../types";
import AnswerSubmissionForm from "./AnswerSubmissionForm";
import LatexRenderer from "./LatexRenderer";

const ProblemView: React.FC<ProblemViewProps> = ({
  problem,
  examId,
  onAnswerSubmit,
  onSkip,
}) => {
  const imageData: ImageData | undefined = problem.image;

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
      <AnswerSubmissionForm onSubmit={onAnswerSubmit} />
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

export default ProblemView;
