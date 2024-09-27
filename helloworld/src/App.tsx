import type React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import GrindOlympiadsIndex from "./GrindOlympiadsIndex";
import GrindOlympiadsLayout from "./GrindOlympiadsLayout";
import LabsRoutes from "./LabsRoutes";
import AdminActionsPage from "./components/AdminActionsPage";
import ExamComponent from "./components/ExamComponent";
import Header from "./components/Header";
import NotificationBell from "./components/NotificationBell";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./components/Settings";
import UserMenu from "./components/UserMenu";
import UserProfile from "./components/UserProfile";
import UserResponseComponent from "./components/UserResponseComponent";
import Users from "./components/Users";
import { AuthProvider } from "./contexts/AuthContext";

const App: React.FC = () => {
  const isStaging = process.env.REACT_APP_ENVIRONMENT === "staging";

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            element={
              <GrindOlympiadsLayout
                isStaging={isStaging}
                Header={Header}
                NotificationBell={NotificationBell}
                UserMenu={UserMenu}
              />
            }
          >
            <Route index element={<GrindOlympiadsIndex />} />
            <Route path="exam/:examId" element={<ExamComponent />} />
            <Route element={<ProtectedRoute adminOnly={false} />}>
              <Route
                path="exam/:examId/respond"
                element={<UserResponseComponent />}
              />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/actions" element={<AdminActionsPage />} />
            </Route>
            <Route path="labs/*" element={<LabsRoutes />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
