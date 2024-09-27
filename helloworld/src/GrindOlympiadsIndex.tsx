import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "./components/Hero";
import LoggedOutPage from "./components/LoggedOutPage";
import TestList from "./components/TestList";
import TestSearch from "./components/TestSearch";
import UserProgress from "./components/UserProgress";
import { useAuth } from "./contexts/AuthContext";
import useTests from "./hooks/useTests";

const GrindOlympiadsIndex: React.FC = () => {
  const [showTests, setShowTests] = useState<boolean>(false);
  const { currentUser, userProfile, isAdminMode } = useAuth();
  const navigate = useNavigate();
  const {
    tests,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCompetition,
    setSelectedCompetition,
    filteredTests,
  } = useTests();

  if (!currentUser) {
    return <LoggedOutPage />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  const userName =
    userProfile?.name || currentUser.displayName || currentUser.email || "User";

  const handleCreateNewTest = () => {
    navigate("/exam/new");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <Hero showTests={showTests} setShowTests={setShowTests} />
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Welcome, {userName}!</h2>

        <div className="flex justify-between items-center mb-6">
          {isAdminMode && (
            <button
              onClick={handleCreateNewTest}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              type="submit"
            >
              Create New Test
            </button>
          )}
        </div>
      </div>
      {showTests && (
        <>
          <TestSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCompetition={selectedCompetition}
            setSelectedCompetition={setSelectedCompetition}
            tests={tests}
          />
          <TestList tests={filteredTests} />
        </>
      )}
      <UserProgress userProgress={userProfile?.progress || []} />
    </div>
  );
};

export default GrindOlympiadsIndex;
