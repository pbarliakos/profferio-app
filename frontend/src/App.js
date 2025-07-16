import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Dashboard */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Alterlife */}
        <Route element={<ProtectedRoute allowedProject="alterlife" />}>
          <Route path="/alterlife" element={<Alterlife />} />
        </Route>

        {/* Other Project */}
        <Route element={<ProtectedRoute allowedProject="other" />}>
          <Route path="/other" element={<Other />} />
        </Route>
      </Routes>
    </Router>
    
  );
}



export default App;