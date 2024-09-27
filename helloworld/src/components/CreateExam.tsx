import { getFunctions, httpsCallable } from "firebase/functions";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getIdToken } from "../firebase";
import type { Exam } from "../types";

const CreateExam: React.FC = () => {
  const [name, setName] = useState("");
  const [competition, setCompetition] = useState("");
  const [year, setYear] = useState("");
  const [examType, setExamType] = useState<Exam["examType"]>("other");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const functions = getFunctions();
      const createExamFunction = httpsCallable<
        {
          name: string;
          competition: string;
          year: string;
          examType: Exam["examType"];
          idToken: string;
        },
        { examId: string }
      >(functions, "createExam");

      const idToken = await getIdToken();
      const result = await createExamFunction({
        name,
        competition,
        year,
        examType,
        idToken,
      });

      const newExamId = result.data.examId;
      navigate(`/exam/${newExamId}`);
    } catch (error) {
      console.error("Error creating exam:", error);
      setError("Failed to create exam. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Create New Exam</h2>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Name (e.g. AIME)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="competition" className="block font-medium mb-1">
            Competition (e.g. AMC)
          </label>
          <input
            type="text"
            id="competition"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="year" className="block font-medium mb-1">
            Year (e.g. 1985, or 2021 Spring)
          </label>
          <input
            type="text"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="examType" className="block font-medium mb-1">
            Exam Type
          </label>
          <select
            id="examType"
            value={examType}
            onChange={(e) => setExamType(e.target.value as Exam["examType"])}
            className="w-full p-2 border rounded"
          >
            <option value="AMC-10">AMC-10</option>
            <option value="AMC-12">AMC-12</option>
            <option value="AMC-8">AMC-8</option>
            <option value="AIME">AIME</option>
            <option value="ARML">ARML</option>
            <option value="Olympiad">Olympiad</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Create Exam
        </button>
      </form>
    </div>
  );
};

export default CreateExam;
