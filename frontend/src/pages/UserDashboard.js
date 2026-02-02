import React, { useEffect } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardActionArea, 
  Grid, 
  Container, 
  Button,
  useTheme
} from "@mui/material";
import { 
  AccessTime as AccessTimeIcon, 
  Email as EmailIcon, 
  Logout as LogoutIcon, 
  Dashboard as DashboardIcon,
  LightMode, 
  DarkMode 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserDashboard = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Διαβάζουμε τον χρήστη
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
         await axios.post("/api/auth/logout");
      }
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // --- LOGIC ΓΙΑ ΤΑ TILES ---
  const projectLower = (user.project || "").toLowerCase().trim();
  
  // 1. Time Tracker: "Σε όλα τα roles θα εμφανίζει το timetracker"
  // Οπότε το κάνουμε true για όλους όσους έχουν πρόσβαση σε αυτό το Dashboard.
  const showTimeTracker = true;

  // 2. Nova FTTH: "Στο project nova θα εμφανιζει και το ftth email"
  // Ελέγχουμε μόνο αν το project είναι "nova".
  const showNovaTool = projectLower.includes("nova");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6} borderBottom={1} borderColor="divider" pb={2}>
          <Box display="flex" alignItems="center" gap={2}>
             <DashboardIcon fontSize="large" color="primary" />
             <Typography variant="h4" fontWeight="bold">
               Dashboard
             </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="subtitle1" sx={{ opacity: 0.7, display: { xs: 'none', sm: 'block' } }}>
              {user.fullName} | <strong>{user.project}</strong>
            </Typography>

            <Button 
              variant="outlined" 
              startIcon={darkMode ? <LightMode /> : <DarkMode />} 
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "Light" : "Dark"}
            </Button>

            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<LogoutIcon />} 
              onClick={handleLogout}
            >
              LOGOUT
            </Button>
          </Box>
        </Box>

        {/* TILES GRID */}
        <Grid container spacing={4} justifyContent="center">
          
          {/* TILE 1: TIME TRACKER (Πλέον ανοιχτό για όλους) */}
          {showTimeTracker && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderRadius: 4, 
                  transition: '0.3s', 
                  bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } 
                }}
              >
                <CardActionArea 
                  onClick={() => window.open("/my-time", "_blank")}
                  sx={{ height: '100%', p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                >
                  <AccessTimeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Time Tracker
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Καταγραφή ωρών εργασίας και διαλειμμάτων.
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          )}

          {/* TILE 2: NOVA FTTH (Μόνο για Nova Project) */}
          {showNovaTool && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderRadius: 4, 
                  transition: '0.3s', 
                  bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } 
                }}
              >
                <CardActionArea 
                  onClick={() => navigate("/nova")}
                  sx={{ height: '100%', p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                >
                  <EmailIcon sx={{ fontSize: 80, color: '#9c27b0', mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    FTTH Coupon Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Εργαλείο αποστολής email για κουπόνια Nova.
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          )}

        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;