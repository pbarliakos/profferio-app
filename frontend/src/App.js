import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import axios from "axios";

// Pages
import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import AdminDashboard from "./pages/AdminDashboard";
import Nova from "./pages/Nova";
import LoginLogs from "./pages/admin/LoginLogs";
import AgentMonitor from "./pages/admin/AgentMonitor";

// Protected wrapper
import ProtectedRoute from "./components/ProtectedRoute";

const API = process.env.REACT_APP_API_URL;

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Καταγραφή logout όταν κλείνει το tab
  useEffect(() => {
    const user = getUserFromStorage();
    if (!user?._id) return;

    const handleUnload = () => {
      const data = JSON.stringify({ userId: user._id });
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon(`${API}/api/auth/logout-beacon`, blob);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ✅ Heartbeat κάθε 15sec
  useEffect(() => {
    const user = getUserFromStorage();
    if (!user?._id) return;

    const interval = setInterval(() => {
      axios.post(`${API}/api/auth/heartbeat`, { userId: user._id });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* Admin-only */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route
              path="/admin"
              element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />}
            />
          </Route>

          {/* Project routes */}
          <Route element={<ProtectedRoute allowedProject="alterlife" />}>
            <Route path="/alterlife" element={<Alterlife />} />
          </Route>

          <Route element={<ProtectedRoute allowedProject="nova" />}>
            <Route path="/nova" element={<Nova />} />
          </Route>

          <Route element={<ProtectedRoute allowedProject="admin" />}>
            <Route path="/admin/loginlogs" element={<LoginLogs />} />
            <Route path="/admin/AgentMonitor" element={<AgentMonitor />} />
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