import { getFunctions, httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";
import type { Exam } from "../types";

interface UseTestsReturn {
  tests: Exam[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCompetition: string;
  setSelectedCompetition: (competition: string) => void;
  filteredTests: Exam[];
}

const useTests = (): UseTestsReturn => {
  const [tests, setTests] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("All");

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const functions = getFunctions();
      const listExams = httpsCallable(functions, "listExams");
      const result = await listExams();
      const data = result.data as { tests: Exam[] };
      setTests(data.tests || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to load tests. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter(
      (test) =>
        (selectedCompetition === "All" ||
          test.competition === selectedCompetition) &&
        (test.competition.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.year.includes(searchTerm)),
    );
  }, [tests, selectedCompetition, searchTerm]);

  return {
    tests,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCompetition,
    setSelectedCompetition,
    filteredTests,
  };
};

export default useTests;
