import { getFunctions, httpsCallable } from "firebase/functions";
import type React from "react";
import { useEffect, useState } from "react";
import { getIdToken } from "../firebase";
import type {
  Exam,
  ExamUpdateData,
  ProblemDetails,
  ProblemReference,
} from "../types";
import DraggableProblemList from "./DraggableProblemList";
import ProblemCreator from "./ProblemCreator";

const ExamEditor: React.FC<{ exam: Exam }> = ({ exam }) => {
  const [creatingProblem, setCreatingProblem] = useState(false);
  const [examType, setExamType] = useState<Exam["examType"]>(
    exam.examType || "other",
  );
  const [problemsToConvert, setProblemsToConvert] = useState<string[]>([]);
  const [problems, setProblems] = useState<
    (Partial<ProblemReference> & Partial<ProblemDetails>)[]
  >(exam.problems);
  const [error, setError] = useState<string | null>(null);
  const [showSortOption, setShowSortOption] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (examType !== exam.examType) {
      const problemsNeedingConversion = problems.filter((problem) => {
        if (examType.startsWith("AMC") && problem.type !== "multiple_choice")
          return true;
        if (
          (examType === "AIME" || examType === "ARML") &&
          problem.type !== "short_answer"
        )
          return true;
        if (examType === "Olympiad" && problem.type !== "essay") return true;
        return false;
      });
      setProblemsToConvert(problemsNeedingConversion.map((p) => p.problemId));
    } else {
      setProblemsToConvert([]);
    }
  }, [examType, problems, exam.examType]);

  useEffect(() => {
    const labels = problems.map((p) => Number.parseInt(p.label));
    setShowSortOption(!labels.every((label, index) => label === index + 1));
  }, [problems]);

  const handleSaveProblem = async (
    problemId: string,
    updatedProblem: ProblemDetails,
  ) => {
    try {
      const functions = getFunctions();
      const updateProblemFunction = httpsCallable(functions, "updateProblem");
      const idToken = await getIdToken();

      const result = await updateProblemFunction({
        examId: exam.id,
        problemId,
        updatedProblem,
        idToken,
      });

      if ((result.data as { success: boolean }).success) {
        console.log("Problem updated successfully");
        setProblems((prevProblems) =>
          prevProblems.map((p) =>
            p.problemId === problemId
              ? { ...p, ...updatedProblem, type: updatedProblem.type }
              : p,
          ),
        );
      } else {
        throw new Error("Failed to update problem");
      }
    } catch (error) {
      console.error("Error updating problem:", error);
      setError("Failed to update problem. Please try again.");
    }
  };

  const handleCreateProblem = async (
    newProblem: ProblemDetails,
    label: string,
  ) => {
    try {
      const functions = getFunctions();
      const createProblemFunction = httpsCallable(functions, "createProblem");
      const labelProblemFunction = httpsCallable(
        functions,
        "labelProblemForExam",
      );
      const idToken = await getIdToken();

      const createResult = await createProblemFunction({
        problem: newProblem,
        idToken,
      });
      const { success, problemId } = createResult.data as {
        success: boolean;
        problemId?: string;
      };

      if (success && problemId) {
        const labelResult = await labelProblemFunction({
          examId: exam.id,
          problemId,
          label,
          idToken,
        });
        const labelSuccess = (labelResult.data as { success: boolean }).success;

        const newProblemRef = {
          problemId,
          label,
          ...newProblem,
        };
        setProblems((prevProblems) => [...prevProblems, newProblemRef]);
        setSyncStatus((prevStatus) => ({
          ...prevStatus,
          [problemId]: labelSuccess,
        }));
        setCreatingProblem(false);
      } else {
        throw new Error("Failed to create problem");
      }
    } catch (error) {
      console.error("Error in problem creation process:", error);
      setError("Failed to create problem. Please try again.");
    }
  };

  const handleLabelProblem = async (problemId: string, label: string) => {
    try {
      const functions = getFunctions();
      const labelProblemFunction = httpsCallable(
        functions,
        "labelProblemForExam",
      );
      const idToken = await getIdToken();

      const result = await labelProblemFunction({
        examId: exam.id,
        problemId,
        label,
        idToken,
      });
      const { success } = result.data as { success: boolean };

      setSyncStatus((prevStatus) => ({ ...prevStatus, [problemId]: success }));
      if (!success) {
        throw new Error("Failed to label problem for exam");
      }
    } catch (error) {
      console.error("Error labeling problem for exam:", error);
      setError("Failed to synchronize problem. Please try again.");
    }
  };

  const getSuggestedLabel = () => {
    if (problems.length === 0) return "1";
    const lastLabel = problems[problems.length - 1].label;
    const numericPart = Number.parseInt(lastLabel.replace(/\D/g, ""));
    return Number.isNaN(numericPart)
      ? `${problems.length + 1}`
      : `${numericPart + 1}`;
  };

  const handleUpdateExam = async () => {
    if (!exam.id) {
      setError("Cannot update exam: Exam ID is missing");
      return;
    }

    try {
      const functions = getFunctions();
      const updateExamFunction = httpsCallable<
        ExamUpdateData & { idToken: string },
        { success: boolean }
      >(functions, "updateExam");

      const idToken = await getIdToken();

      const result = await updateExamFunction({
        examId: exam.id,
        examType,
        problemsToConvert,
        idToken,
      });

      if (result.data.success) {
        console.log("Exam updated successfully");
        setProblems((prevProblems) =>
          prevProblems.map((p) => {
            if (problemsToConvert.includes(p.problemId)) {
              let newType = p.type;
              if (examType.startsWith("AMC")) newType = "multiple_choice";
              else if (examType === "AIME" || examType === "ARML")
                newType = "short_answer";
              else if (examType === "Olympiad") newType = "essay";
              return { ...p, type: newType };
            }
            return p;
          }),
        );
        setProblemsToConvert([]);
        setError(null);
      } else {
        throw new Error("Failed to update exam");
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      setError("Failed to update exam. Please try again.");
    }
  };

  const toggleProblemConversion = (problemId: string) => {
    setProblemsToConvert((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId],
    );
  };

  const handleSortProblems = () => {
    const sortedProblems = [...problems].sort(
      (a, b) => Number.parseInt(a.label) - Number.parseInt(b.label),
    );
    setProblems(sortedProblems);
    setShowSortOption(false);
  };

  return (
    <div>
      <div className="bg-gray-100 p-4 mb-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Editing Exam: {exam.title}</h2>
        <p>
          <strong>Competition:</strong> {exam.competition}
        </p>
        <p>
          <strong>Year:</strong> {exam.year}
        </p>
        <p>
          <strong>Name:</strong> {exam.name}
        </p>
      </div>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="examType" className="block font-bold mb-2">
          Exam Type:
        </label>
        <select
          id="examType"
          value={examType}
          onChange={(e) => setExamType(e.target.value as Exam["examType"])}
          className="w-full p-2 border rounded"
        >
          <option value="other">Other</option>
          <option value="AMC-8">AMC-8</option>
          <option value="AMC-10">AMC-10</option>
          <option value="AMC-12">AMC-12</option>
          <option value="AIME">AIME</option>
          <option value="ARML">ARML</option>
          <option value="Olympiad">Olympiad</option>
        </select>
      </div>
      {problemsToConvert.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Problems to Convert:</h3>
          {problems.map((problem) => (
            <div key={problem.problemId} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`convert-${problem.problemId}`}
                checked={problemsToConvert.includes(problem.problemId)}
                onChange={() => toggleProblemConversion(problem.problemId)}
                className="mr-2"
              />
              <label htmlFor={`convert-${problem.problemId}`}>
                Problem {problem.label} (Current Type: {problem.type})
              </label>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleUpdateExam}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        type="submit"
      >
        Update Exam
      </button>
      <button
        onClick={() => setCreatingProblem(true)}
        className="mb-4 ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        type="submit"
      >
        Add New Problem
      </button>
      {showSortOption && (
        <button
          onClick={handleSortProblems}
          className="mb-4 ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          type="submit"
        >
          Sort Problems
        </button>
      )}
      {creatingProblem && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="text-xl font-semibold mb-2">Create New Problem</h3>
          <ProblemCreator
            onSave={handleCreateProblem}
            onCancel={() => setCreatingProblem(false)}
            suggestedLabel={getSuggestedLabel()}
          />
        </div>
      )}
      <DraggableProblemList
        problems={problems.map((p) => ({
          ...p,
          ...exam.problems.find((ep) => ep.problemId === p.problemId),
        }))}
        setProblems={setProblems}
        handleSaveProblem={handleSaveProblem}
        handleLabelProblem={handleLabelProblem}
        syncStatus={syncStatus}
      />
    </div>
  );
};

export default ExamEditor;
