import { Settings } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import type {
  AIMEProblemDetails,
  AMCProblemDetails,
  OlympiadProblemDetails,
  ProblemDetails,
} from "../types";
import LatexRenderer from "./LatexRenderer";
import ProblemEditor from "./ProblemEditor";

interface EditableProblemCardProps {
  problem: ProblemDetails & {
    problemId: string;
    label: string;
  };
  index: number;
  handleSaveProblem: (
    problemId: string,
    updatedProblem: ProblemDetails,
  ) => Promise<void>;
  handleLabelProblem: (problemId: string, label: string) => Promise<void>;
  syncStatus: boolean | undefined;
}

const EditableProblemCard: React.FC<EditableProblemCardProps> = ({
  problem,
  index,
  handleSaveProblem,
  handleLabelProblem,
  syncStatus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showUserIndexInput, setShowUserIndexInput] = useState(false);
  const [userIndex, setUserIndex] = useState(() => {
    return localStorage.getItem("firestoreUserIndex") || "0";
  });

  useEffect(() => {
    localStorage.setItem("firestoreUserIndex", userIndex);
  }, [userIndex]);

  const getPreviewContent = (statement: string): string => {
    const maxLength = 150;
    let preview = statement;

    if (preview.length > maxLength) {
      preview = `${preview.substring(0, maxLength)}...`;
    }

    const lastOpenBracket = preview.lastIndexOf("\\[");
    const lastCloseBracket = preview.lastIndexOf("\\]");
    if (lastOpenBracket > lastCloseBracket) {
      preview = `${preview.substring(0, lastOpenBracket)}...`;
    }

    return preview;
  };

  const renderOptions = () => {
    if (problem.type === "multiple_choice") {
      const mcProblem = problem as AMCProblemDetails;
      return (
        <div className="mt-2">
          <h4 className="font-semibold">Options:</h4>
          {Object.entries(mcProblem.options).map(([key, value]) => (
            <div
              key={key}
              className={`p-2 border rounded mt-1 ${
                key === mcProblem.correctAnswer
                  ? "bg-green-100 border-green-500"
                  : ""
              }`}
            >
              <span className="font-bold mr-2">{key}:</span>
              <LatexRenderer latex={value} />
            </div>
          ))}
          {!mcProblem.correctAnswer && (
            <p className="text-red-500 mt-2">No correct answer set</p>
          )}
        </div>
      );
    }
    if (problem.type === "short_answer") {
      const saProblem = problem as AIMEProblemDetails;
      return (
        <div className="mt-2">
          <h4 className="font-semibold">Correct Answer:</h4>
          <p>{saProblem.correctAnswer || "No correct answer set"}</p>
        </div>
      );
    }
    if (problem.type === "essay") {
      const essayProblem = problem as OlympiadProblemDetails;
      return (
        <div className="mt-2">
          <h4 className="font-semibold">Solution Guidelines:</h4>
          <p>
            {essayProblem.solutionGuidelines || "No solution guidelines set"}
          </p>
        </div>
      );
    }
  };

  const getFirestoreDebugLink = () => {
    return `https://console.firebase.google.com/u/${userIndex}/project/olympiads/firestore/databases/grindolympiads/data/~2Fproblems~2F${problem.problemId}`;
  };

  const handleUserIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserIndex(e.target.value);
  };

  return (
    <Draggable draggableId={problem.problemId} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4 p-4 border rounded bg-white shadow-md"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">
              Problem {problem.label} ({problem.type})
            </h3>
            <div className="flex items-center space-x-2">
              {syncStatus === false && (
                <button
                  onClick={() =>
                    handleLabelProblem(problem.problemId, problem.label)
                  }
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                  type="submit"
                >
                  Sync Problem
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowUserIndexInput(!showUserIndexInput)}
                  className="p-1 rounded-full hover:bg-gray-200"
                  title="Change Firestore user index"
                  type="submit"
                >
                  <Settings size={20} />
                </button>
                {showUserIndexInput && (
                  <div className="absolute right-0 mt-2 p-2 bg-white rounded-md shadow-xl z-10">
                    <input
                      type="text"
                      value={userIndex}
                      onChange={handleUserIndexChange}
                      className="border rounded px-2 py-1 w-20"
                      placeholder="User Index"
                    />
                  </div>
                )}
              </div>
              <a
                href={getFirestoreDebugLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                Debug in Firestore
              </a>
            </div>
          </div>
          {isEditing ? (
            <ProblemEditor
              problem={problem}
              problemLabel={problem.label}
              onSave={(updatedProblem) => {
                handleSaveProblem(problem.problemId, updatedProblem);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="mb-2">
                <LatexRenderer latex={getPreviewContent(problem.statement)} />
              </div>
              {renderOptions()}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                type="submit"
              >
                Edit Problem
              </button>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default EditableProblemCard;
