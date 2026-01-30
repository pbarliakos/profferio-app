import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import axios from "axios";

// Σελίδες
import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import AdminDashboard from "./pages/AdminDashboard";
import Nova from "./pages/Nova";
// 👇 ΔΙΟΡΘΩΣΗ: Πλέον δείχνει στο σωστό αρχείο MyTime.js
import MyTime from "./pages/MyTime"; 

// Admin Σελίδες
import AdminTimeLogs from "./pages/admin/AdminTimeLogs";
import LoginLogs from "./pages/admin/LoginLogs";
import AgentMonitor from "./pages/admin/AgentMonitor";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// ✅ Axios Interceptor: Βάζει αυτόματα το token σε κάθε αίτημα
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  // ✅ Φόρτωση του theme
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; 
  });

  // ✅ Αποθήκευση της προτίμησης theme
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ✅ Καταγραφή logout όταν κλείνει το tab
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    const user = JSON.parse(rawUser);
    if (!user?._id) return;

    const handleUnload = () => {
      const data = JSON.stringify({ userId: user._id });
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon("/api/auth/logout-beacon", blob);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ✅ Heartbeat timer
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    const user = JSON.parse(rawUser);
    if (!user?._id) return;

    const interval = setInterval(() => {
      axios.post("/api/auth/heartbeat", { userId: user._id });
    }, 15 * 1000);

    return () => clearInterval(interval);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: darkMode ? "dark" : "light" },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />} />

          {/* 🛡️ Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/admin/timelogs" element={<AdminTimeLogs darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/admin/loginlogs" element={<LoginLogs darkMode={darkMode} />} />
            <Route path="/admin/AgentMonitor" element={<AgentMonitor darkMode={darkMode} />} />
          </Route>

          {/* 🛡️ Time Project Route */}
          <Route element={<ProtectedRoute allowedProject="time" />}>
            <Route path="/my-time" element={<MyTime darkMode={darkMode} setDarkMode={setDarkMode} />} />
          </Route>

          <Route element={<ProtectedRoute allowedProject="alterlife" />}>
            <Route path="/alterlife" element={<Alterlife />} />
          </Route>

          <Route element={<ProtectedRoute allowedProject="nova" />}>
            <Route path="/nova" element={<Nova />} />
          </Route>

          <Route element={<ProtectedRoute allowedProject="other" />}>
            <Route path="/other" element={<Other />} />
          </Route>

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;