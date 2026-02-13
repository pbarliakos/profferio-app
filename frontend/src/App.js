import React, { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline, Snackbar, Alert } from "@mui/material";
import axios from "axios";
import io from "socket.io-client";

// Σελίδες
import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import AdminDashboard from "./pages/AdminDashboard";
import Nova from "./pages/Nova";
import TeamAgentLogs from "./pages/TeamAgentLogs";
import MyTimeNew from "./pages/MyTimeNew";
import UserDashboard from "./pages/UserDashboard";
import SalesTools from "./pages/SalesTools";
import TicketsDashboard from "./pages/TicketsDashboard";
import CreateTicket from "./pages/CreateTicket";
import TicketDetails from "./pages/TicketDetails";

// Admin Σελίδες
import AdminTimeLogs from "./pages/admin/AdminTimeLogs";
import LoginLogs from "./pages/admin/LoginLogs";
import AgentMonitor from "./pages/admin/AgentMonitor";
import TeamMonitor from "./pages/TeamMonitor";

import ProtectedRoute from "./components/ProtectedRoute";
import GlobalTimer from "./components/GlobalTimer";

// SOCKET CONFIG
const ENDPOINT = process.env.REACT_APP_API_URL || "http://localhost:5000";
let socket;

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/") {
        console.warn("Session expired. Redirecting...");
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; 
  });

  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ✅ SOCKET.IO LOGIC
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
        const user = JSON.parse(rawUser);
        
        socket = io(ENDPOINT);
        socket.emit("setup", user);

        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        socket.on("ticket_notification", (data) => {
            // ✅ CHECK: Αν εγώ έκανα την ενέργεια, μην μου δείξεις ειδοποίηση!
            if (data.senderId === user._id) return;

            // A. Windows Notification
            if (Notification.permission === "granted") {
                new Notification(data.title, {
                    body: data.message,
                    icon: "/Profferio.png",
                    requireInteraction: true,
                    tag: data.ticketId
                });
            }

            // B. In-App Notification
            setNotification({
                open: true,
                message: data.message,
                severity: data.type || "info"
            });

            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
        });
    }

    return () => {
        if (socket) socket.disconnect();
    };
  }, []);

  // Beacon Logout
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

  // Heartbeat
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    const user = JSON.parse(rawUser);
    if (!user?._id) return;

    const interval = setInterval(() => {
      axios.post("/api/auth/heartbeat", { userId: user._id }).catch(() => {}); 
    }, 15 * 1000);

    return () => clearInterval(interval);
  }, []);

  const theme = useMemo(
    () => createTheme({ palette: { mode: darkMode ? "dark" : "light" } }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <GlobalTimer />
          <Routes>
            <Route path="/" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />} />

            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route path="/admin" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/admin/timelogs" element={<AdminTimeLogs darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/admin/loginlogs" element={<LoginLogs darkMode={darkMode} />} />
              <Route path="/admin/AgentMonitor" element={<AgentMonitor darkMode={darkMode} setDarkMode={setDarkMode} />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<UserDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/my-time" element={<MyTimeNew darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/team-monitor" element={<TeamMonitor darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/nova/sales-tools" element={<SalesTools darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/team-logs" element={<TeamAgentLogs darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/tickets" element={<TicketsDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/tickets/new" element={<CreateTicket darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/tickets/:id" element={<TicketDetails darkMode={darkMode} setDarkMode={setDarkMode} />} />
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

          <Snackbar 
            open={notification.open} 
            autoHideDuration={10000} 
            onClose={() => setNotification({ ...notification, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }} 
          >
            <Alert 
                onClose={() => setNotification({ ...notification, open: false })} 
                severity={notification.severity} 
                variant="filled" 
                sx={{ width: '100%', fontSize: '1rem' }}
            >
                {notification.message}
            </Alert>
          </Snackbar>

      </Router>
    </ThemeProvider>
  );
}

export default App;