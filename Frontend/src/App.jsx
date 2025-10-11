import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/dashboard";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import HorizontalLayout from "./Components/HorizontalLayout";
import VerifyEmail from "./pages/verifyEmail.jsx";
import ChatBot from "./pages/ChatBot.jsx"; // <- Import ChatBot

const App = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>; // show loader while checking auth

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/signin"
          element={!user ? <Register /> : <Navigate to="/app/dashboard" />}
        />
        <Route
          path="/signup"
          element={!user ? <Register /> : <Navigate to="/app/dashboard" />}
        />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route
          path="/app"
          element={user ? <HorizontalLayout /> : <Navigate to="/" replace />}
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chatbot" element={<ChatBot />} /> {/* ChatBot route */}
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="text-center p-10">
              <h2 className="text-3xl font-bold text-red-500">404 - Page Not Found</h2>
              <p className="text-gray-600 mt-2">Please check the URL and try again.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
