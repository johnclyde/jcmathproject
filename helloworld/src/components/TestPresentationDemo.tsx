import type React from "react";
import { useState } from "react";
import type { Exam } from "../types";
import TestPresentation from "./TestPresentation";

const generateMockExams = (): Exam[] => {
  const exams: Exam[] = [];
  const currentYear = new Date().getFullYear();

  // Generate AMC 10 exams
  for (let i = 0; i < 50; i++) {
    const year = currentYear - Math.floor(i / 2);
    exams.push({
      id: `amc10-${i}`,
      title: `AMC 10${["A", "B"][i % 2]} ${currentYear - i}`,
      competition: "AMC",
      year: `${year}`,
      name: `AMC 10${["A", "B"][i % 2]}`,
      examType: "AMC-10",
      problems: [],
    });
  }

  // Generate AMC 12 exams
  for (let i = 0; i < 48; i++) {
    const year = currentYear - Math.floor(i / 2);
    exams.push({
      id: `amc12-${i}`,
      title: `AMC 12${["A", "B"][i % 2]} ${currentYear - i}`,
      competition: "AMC",
      year: `${year}`,
      name: `AMC 12${["A", "B"][i % 2]}`,
      examType: "AMC-12",
      problems: [],
    });
  }

  // Generate AHSME exams (listed as AMC-12)
  for (let i = 0; i < 50; i++) {
    exams.push({
      id: `ahsme-${i}`,
      title: `AHSME ${1999 - i}`,
      competition: "AMC",
      year: `${1999 - i}`,
      name: "AHSME",
      examType: "AMC-12",
      problems: [],
    });
  }

  // Generate AIME exams
  for (let i = 0; i < 70; i++) {
    const year = currentYear - Math.floor(i / 2);
    exams.push({
      id: `aime-${i}`,
      title: `AIME ${["I", "II"][i % 2]} ${currentYear - i}`,
      competition: "AIME",
      year: `${year}`,
      name: `AIME ${["I", "II"][i % 2]}`,
      examType: "AIME",
      problems: [],
    });
  }

  // Generate USAMO exams
  for (let i = 0; i < 40; i++) {
    exams.push({
      id: `usamo-${i}`,
      title: `USAMO ${currentYear - i}`,
      competition: "USAMO",
      year: `${currentYear - i}`,
      name: "USAMO",
      examType: "Olympiad",
      problems: [],
    });
  }

  // Generate ARML exams
  for (let i = 0; i < 20; i++) {
    exams.push({
      id: `arml-${i}`,
      title: `ARML ${currentYear - i}`,
      competition: "ARML",
      year: `${currentYear - i}`,
      name: "ARML",
      examType: "ARML",
      problems: [],
    });
  }

  // Generate other miscellaneous exams
  const otherExams = ["IMO Shortlist", "ELMO", "APMO", "RMM"];
  for (let i = 0; i < 20; i++) {
    const examName = otherExams[i % otherExams.length];
    exams.push({
      id: `other-${i}`,
      title: `${examName} ${currentYear - i}`,
      competition: examName,
      year: `${currentYear - i}`,
      name: examName,
      examType: "other",
      problems: [],
    });
  }

  return exams;
};

const TestPresentationDemo: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const exams = generateMockExams();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Test Presentation Demo</h1>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isAdminMode}
            onChange={() => setIsAdminMode(!isAdminMode)}
            className="mr-2"
          />
          Admin Mode
        </label>
      </div>
      <TestPresentation tests={exams} isAdminMode={isAdminMode} />
    </div>
  );
};

export default TestPresentationDemo;
