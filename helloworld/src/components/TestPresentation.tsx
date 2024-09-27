import { ChevronDown, ChevronUp, Edit, Search } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Exam } from "../types";

interface TestCategoryProps {
  title: string;
  tests: Exam[];
  color: string;
  isAdminMode: boolean;
}

const TestCategory: React.FC<TestCategoryProps> = ({
  title,
  tests,
  color,
  isAdminMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="mb-2">
      <div
        className={`flex items-center justify-between p-2 cursor-pointer ${color} text-white`}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsExpanded(!isExpanded);
          }
        }}
        tabIndex={0}
        role="button"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 bg-gray-100">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white p-2 rounded shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              <div className="font-semibold">
                {test.name} ({test.year})
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {test.competition}
                </span>
                <div>
                  {isAdminMode && (
                    <button
                      onClick={() => navigate(`/exam/${test.id}`)}
                      className="text-green-500 hover:text-green-700 text-xs mr-2"
                      type="submit"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  <Link
                    to={`/exam/${test.id}${isAdminMode ? "/edit" : ""}`}
                    className="text-blue-500 hover:text-blue-700 text-xs"
                  >
                    {isAdminMode ? "Edit" : "Take Test"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TestPresentationProps {
  tests: Exam[];
  isAdminMode: boolean;
}

const TestPresentation: React.FC<TestPresentationProps> = ({
  tests,
  isAdminMode,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { title: "AMC 8", color: "bg-blue-400", types: ["AMC-8"] },
    { title: "AMC 10", color: "bg-blue-500", types: ["AMC-10"] },
    { title: "AMC 12", color: "bg-blue-600", types: ["AMC-12"] },
    { title: "AIME", color: "bg-blue-700", types: ["AIME"] },
    { title: "ARML", color: "bg-purple-600", types: ["ARML"] },
    { title: "Other", color: "bg-gray-600", types: ["other", "MATHCOUNTS"] },
  ];

  const filteredTests = tests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.competition.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Math Competition Tests</h1>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tests..."
            className="w-full pl-8 pr-4 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {categories.map((category) => (
        <TestCategory
          key={category.title}
          title={category.title}
          tests={filteredTests.filter((test) =>
            category.types.includes(test.examType),
          )}
          color={category.color}
          isAdminMode={isAdminMode}
        />
      ))}
    </div>
  );
};

export default TestPresentation;
