import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Nova from "./pages/Nova";
import LoginLogs from "./pages/admin/LoginLogs";
import AgentMonitor from "./pages/admin/AgentMonitor";
import axios from "axios";

function App() {
  const [darkMode, setDarkMode] = useState(false);

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
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // ✅ Heartbeat timer για real-time monitoring
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    const user = JSON.parse(rawUser);
    if (!user?._id) return;

    const interval = setInterval(() => {
      axios.post("/api/auth/heartbeat", {
        userId: user._id,
      });
    }, 15 * 1000); // κάθε 15 δευτερόλεπτα

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
          <Route path="/" element={<Login />} />

          {/* Admin Dashboard */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route
              path="/admin"
              element={
                <AdminDashboard
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              }
            />
          </Route>

          {/* Alterlife */}
          <Route element={<ProtectedRoute allowedProject="alterlife" />}>
            <Route path="/alterlife" element={<Alterlife />} />
          </Route>

          {/* Nova Project */}
          <Route element={<ProtectedRoute allowedProject="nova" />}>
            <Route path="/nova" element={<Nova />} />
          </Route>

          {/* Logins Logs */}
          <Route element={<ProtectedRoute allowedProject="admin" />}>
            <Route path="/admin/loginlogs" element={<LoginLogs />} />
          </Route>

          {/* Agent Monitor */}
          <Route element={<ProtectedRoute allowedProject="admin" />}>
            <Route path="/admin/AgentMonitor" element={<AgentMonitor />} />
          </Route>

          {/* Other Project */}
          <Route element={<ProtectedRoute allowedProject="other" />}>
            <Route path="/other" element={<Other />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;