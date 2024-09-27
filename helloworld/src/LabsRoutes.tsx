import type React from "react";
import { Route, Routes } from "react-router-dom";
import ComponentDirectory from "./ComponentDirectory";
import AchievementsPage from "./components/AchievementsPage";
import BallSortingPuzzle from "./components/BallSortingPuzzle";
import BanzukeSurfer from "./components/BanzukeSurfer";
import ChallengeStatusPageDemo from "./components/ChallengeStatusPageDemo";
import Challenges from "./components/Challenges";
import InteractiveMultiChart from "./components/Chariart";
import ClaudeChat from "./components/ClaudeChat";
import ColorPicker from "./components/ColorPicker";
import DetailedTestSummaryDemo from "./components/DetailedTestSummaryDemo";
import DualModeCalculator from "./components/DualModeCalculator";
import InteractiveCounter from "./components/InteractiveCounter";
import LoginWarningPopup from "./components/LoginWarningPopup";
import InteractiveMatrixOperations from "./components/MatrixMath";
import FifteenPuzzle from "./components/MylesFifteen";
import ProblemEditorDemo from "./components/ProblemEditorDemo";
import Settings from "./components/Settings";
import TestPresentationDemo from "./components/TestPresentationDemo";
import UserStats from "./components/UserStats";

const LabsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ComponentDirectory />} />
      <Route path="banzuke-surfer" element={<BanzukeSurfer />} />
      <Route path="interactive-counter" element={<InteractiveCounter />} />
      <Route path="color-picker" element={<ColorPicker />} />
      <Route path="problem-editor-demo" element={<ProblemEditorDemo />} />
      <Route path="login-warning-popup" element={<LoginWarningPopup />} />
      <Route path="challenges" element={<Challenges />} />
      <Route path="settings" element={<Settings />} />
      <Route path="myfuntiles" element={<FifteenPuzzle />} />
      <Route path="tubehilla" element={<BallSortingPuzzle />} />
      <Route path="chariarts" element={<InteractiveMultiChart />} />
      <Route path="matrix-wizard" element={<InteractiveMatrixOperations />} />
      <Route path="claude-ide" element={<ClaudeChat />} />
      <Route path="dual-mode-calculator" element={<DualModeCalculator />} />
      <Route
        path="detailed-test-summary"
        element={<DetailedTestSummaryDemo />}
      />
      <Route path="test-presentation-demo" element={<TestPresentationDemo />} />
      <Route
        path="user-stats"
        element={
          <UserStats
            user={{
              id: "1",
              name: "John Doe",
              email: "john@example.com",
              problemsSolved: 150,
              testsCompleted: 5,
              averageScore: 85,
              testScores: [
                { name: "Test 1", score: 80 },
                { name: "Test 2", score: 85 },
                { name: "Test 3", score: 90 },
                { name: "Test 4", score: 75 },
                { name: "Test 5", score: 95 },
              ],
            }}
          />
        }
      />
      <Route path="achievements" element={<AchievementsPage />} />
      <Route
        path="challenge-status-page"
        element={<ChallengeStatusPageDemo />}
      />
    </Routes>
  );
};

export default LabsRoutes;
