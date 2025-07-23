import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LogoHeader from "../components/LogoHeader";

const API = process.env.REACT_APP_API_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    // Clear old storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("project");
  
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        username,
        password,
      });
  
      const { token, user } = res.data;
      if (user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        localStorage.setItem("project", user.project);
  
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.project === "alterlife") {
          navigate("/alterlife");
        } else if (user.project === "nova") {
          navigate("/nova");
        } else {
          navigate("/other");
        }
      } else {
        setError("Login failed: Invalid user data");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };
  


  return (
    <Container maxWidth="xs">
      <LogoHeader />
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;