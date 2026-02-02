import React, { useState } from "react";
import { 
  Container, TextField, Button, Typography, Paper, Box, 
  IconButton, Tooltip, InputAdornment, Alert 
} from "@mui/material";
import { 
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  Visibility, 
  VisibilityOff,
  Login as LoginIcon 
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ darkMode, setDarkMode }) => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        identifier: formData.identifier.trim(),
        password: formData.password
      };

      const res = await axios.post("/api/auth/login", payload);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      localStorage.setItem("project", user.project);

      // ✅ LOGIC: Μετατροπή σε πεζά για σίγουρο έλεγχο
      const role = user.role ? user.role.toLowerCase() : "user";
      const project = user.project ? user.project.toLowerCase() : "other";

      console.log("Login Success -> Redirecting:", { role, project });

      // ✅ ROUTING SYSTEM
      if (role === "admin") {
        navigate("/admin");
      } 
      else if (project === "epic") {
        navigate("/dashboard");
      }
      else if (project === "alterlife") {
        navigate("/dashboard");
      } 
      else if (project === "nova") {
        navigate("/dashboard");
      }
      else {
        navigate("/dashboard");
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Αποτυχία σύνδεσης. Ελέγξτε τα στοιχεία σας.");
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      position: "relative", 
      display: "flex", 
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "background.default",
      transition: "background-color 0.3s ease"
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

      <Container maxWidth="xs"> 
        
        {/* LOGO - Βεβαιώσου ότι το αρχείο είναι στο 'public/icons/Profferio.png' */}
        <Box display="flex" justifyContent="center" mb={3} mt={-5}>
           <img 
              src="/Profferio.png" 
              alt="Profferio Logo" 
              style={{ width: "360px", objectFit: "contain" }} 
              // Αν δεν το βρίσκει, δοκίμασε να βάλεις ένα console.log εδώ για debug
              onError={(e) => { 
                  console.error("Logo not found at /icons/Profferio.png");
                  e.target.style.display = 'none'; 
              }} 
            />
        </Box>

        <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
            Welcome to Profferio
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
             Εισάγετε τα στοιχεία σας για να συνδεθείτε
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              label="Username ή Email"
              name="identifier"
              fullWidth
              margin="normal"
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              required
            />
            
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, fontSize: "0.9rem" }}>
                {error}
              </Alert>
            )}

            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large"
              startIcon={<LoginIcon />}
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
            >
              ΣΥΝΔΕΣΗ
            </Button>
          </form>

          <Typography variant="caption" display="block" align="center" color="text.secondary" mt={3}>
            Profferio © {new Date().getFullYear()}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;