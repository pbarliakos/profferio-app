import React, { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Nova from "./pages/Nova";

function App() {
  const [darkMode, setDarkMode] = useState(false);

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