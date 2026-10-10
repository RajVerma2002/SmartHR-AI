import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Leaves from "@/pages/Leaves";
import Payroll from "@/pages/Payroll";
import Applicants from "@/pages/Applicants";
import ResumeScreening from "@/pages/ResumeScreening";
import InterviewGenerator from "@/pages/InterviewGenerator";
import Chatbot from "@/pages/Chatbot";
import Settings from "@/pages/Settings";

const MANAGERS = ["Super Admin", "HR Manager"];

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/employees" element={<ProtectedRoute roles={MANAGERS}><Employees /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute roles={MANAGERS}><Payroll /></ProtectedRoute>} />
        <Route path="/applicants" element={<ProtectedRoute roles={MANAGERS}><Applicants /></ProtectedRoute>} />
        <Route path="/resume-screening" element={<ProtectedRoute roles={MANAGERS}><ResumeScreening /></ProtectedRoute>} />
        <Route path="/interview-generator" element={<ProtectedRoute roles={MANAGERS}><InterviewGenerator /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
