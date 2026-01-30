import React, { useState } from "react";
import { Container, TextField, Button, Typography, Paper, Box, IconButton, Tooltip } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LogoHeader from "../components/LogoHeader";

const Login = ({ darkMode, setDarkMode }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", { username, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      localStorage.setItem("project", user.project);

      // ✅ ΝΕΑ ΛΟΓΙΚΗ REDIRECT
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        // Όλοι οι άλλοι ρόλοι και projects πάνε στο Dashboard
        navigate("/dashboard");
      }
      
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      position: "relative", 
      display: "flex", 
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "background.default"
    }}>
      
      {/* Theme Toggle */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton 
            onClick={() => setDarkMode(!darkMode)} 
            color="inherit" 
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Container maxWidth="xs" sx={{ mt: -20 }}> 
        <LogoHeader />
        <Paper elevation={6} sx={{ p: 4, mt: 4, borderRadius: 3 }}>
          <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
            Login
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && (
              <Typography color="error" variant="body2" mt={1} align="center">
                {error}
              </Typography>
            )}
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
            >
              LOGIN
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;