import type React from "react";
import {
  DragDropContext,
  type DropResult,
  Droppable,
} from "react-beautiful-dnd";
import type {
  AIMEProblemDetails,
  AMCProblemDetails,
  OlympiadProblemDetails,
  ProblemDetails,
  ProblemListProps,
  ProblemReference,
} from "../types";
import EditableProblemCard from "./EditableProblemCard";

const DraggableProblemList: React.FC<ProblemListProps> = ({
  problems,
  setProblems,
  handleSaveProblem,
  handleLabelProblem,
  syncStatus,
}) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(problems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setProblems(items);
  };

  const transformProblem = (
    problem: Partial<ProblemReference> & Partial<ProblemDetails>,
  ): ProblemDetails & { problemId: string; label: string } => {
    const baseProblem = {
      problemId: problem.problemId,
      label: problem.label,
      statement: problem.statement || "",
      type: problem.type || "multiple_choice",
    };

    switch (problem.type) {
      case "multiple_choice":
        return {
          ...baseProblem,
          options: problem.options || {},
          correctAnswer: problem.correctAnswer || "",
        } as AMCProblemDetails & { problemId: string; label: string };
      case "short_answer":
        return {
          ...baseProblem,
          correctAnswer: "",
        } as AIMEProblemDetails & { problemId: string; label: string };
      case "essay":
        return {
          ...baseProblem,
          solutionGuidelines: "",
        } as OlympiadProblemDetails & { problemId: string; label: string };
      default:
        return baseProblem as ProblemDetails & {
          problemId: string;
          label: string;
        };
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="problems">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {problems.map((problem, index) => (
              <EditableProblemCard
                key={problem.problemId}
                problem={transformProblem(problem)}
                index={index}
                handleSaveProblem={handleSaveProblem}
                handleLabelProblem={handleLabelProblem}
                syncStatus={syncStatus[problem.problemId]}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableProblemList;
