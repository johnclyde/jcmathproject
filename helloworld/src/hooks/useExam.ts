import { useEffect, useState } from "react";
import { getIdToken } from "../firebase";

interface Problem {
  id: string;
  number: number;
  question: string;
}

interface Exam {
  id: string;
  title: string;
  problems: Problem[];
}

const useExam = (examId: string) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(`/api/exam/${examId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch exam");
        }
        const data = await response.json();
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
        setError("Failed to load exam. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const submitAnswer = async (
    examId: string,
    problemId: string,
    answer: string,
  ) => {
    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/submit-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          examId,
          problemId,
          answer,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      // You might want to update some local state here to reflect the submitted answer
    } catch (err) {
      console.error("Error submitting answer:", err);
      // You might want to show an error message to the user here
    }
  };

  return { exam, loading, error, submitAnswer };
};

export default useExam;
