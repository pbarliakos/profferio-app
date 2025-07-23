import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let user = null;
try {
  const rawUser = localStorage.getItem("user");
  user = rawUser && rawUser !== "undefined" ? JSON.parse(rawUser) : null;
} catch (e) {
  user = null;
}
  if (!token || !user) return <Navigate to="/" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return children;
};

export default AdminRoute;