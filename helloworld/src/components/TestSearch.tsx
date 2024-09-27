import type React from "react";
import type { Exam } from "../types";

interface TestSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCompetition: string;
  setSelectedCompetition: (competition: string) => void;
  tests: Exam[];
}

const TestSearch: React.FC<TestSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCompetition,
  setSelectedCompetition,
  tests,
}) => {
  const competitions = [
    "All",
    ...Array.from(
      new Set(tests.map((test) => test.competition)),
      (competition) => competition,
    ),
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
        <input
          type="text"
          placeholder="Search tests..."
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="mt-4 md:mt-0 w-full md:w-auto px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCompetition}
          onChange={(e) => setSelectedCompetition(e.target.value)}
        >
          {competitions.map((competition) => (
            <option key={competition} value={competition}>
              {competition}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TestSearch;
