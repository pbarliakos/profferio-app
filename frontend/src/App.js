import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Alterlife from "./pages/Alterlife";
import Other from "./pages/Other";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/alterlife" element={<Alterlife />} />
        <Route path="/other" element={<Other />} />
      </Routes>
    </Router>
  );
}

export default App;