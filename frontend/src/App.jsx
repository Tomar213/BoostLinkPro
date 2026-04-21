import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home            from "./pages/Home";
import Pricing         from "./pages/Pricing";
import HelpCentre      from "./pages/HelpCentre";
import Login           from "./pages/Login";
import ConnectInstagram from "./pages/ConnectInstagram";

// Handle ?auth=success on home page — refresh user state
function AuthSuccessHandler() {
  const [params] = useSearchParams();
  const { fetchMe } = useAuth();
  useEffect(() => {
    if (params.get("auth") === "success") fetchMe();
  }, []);
  return null;
}

function AppRoutes() {
  return (
    <>
      <AuthSuccessHandler />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                 element={<Home />} />
          <Route path="/pricing"          element={<Pricing />} />
          <Route path="/help"             element={<HelpCentre />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/connect-instagram" element={
            <ProtectedRoute><ConnectInstagram /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
