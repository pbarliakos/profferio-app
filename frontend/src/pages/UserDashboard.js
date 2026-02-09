import React from "react"; 
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
  Groups as GroupsIcon,
  HistoryEdu as LogsIcon, 
  LightMode, 
  DarkMode,
  Handyman as HandymanIcon,
  Security as SecurityIcon, // ✅ Για το Reset Password
  Assistant as AssistantIcon // ✅ Για το Copilot
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserDashboard = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
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

  const projectLower = (user.project || "").toLowerCase().trim();
  const userRole = (user.role || "").toLowerCase().trim();
  
  const showTimeTracker = true;
  const showTeamMonitor = userRole === "team leader"; 
  const showNovaTool = projectLower.includes("nova");
  const showAgentLogs = userRole === "team leader";
  
  // ✅ LOGIC: Εμφάνιση Sales Tools αν project=nova Ή role=backoffice
  const showSalesTools = projectLower === "nova" || userRole === "backoffice";

  // ✅ Κοινό στυλ για όλα τα Tiles
  const tileStyle = {
    height: "100%", 
    minHeight: "250px", // Σταθερό ελάχιστο ύψος
    display: "flex", 
    flexDirection: "column",
    justifyContent: "center",
    borderRadius: 4, 
    transition: '0.3s', 
    bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
    '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } 
  };

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
              {user.fullName} | <strong>{user.project}</strong> | {user.role}
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
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          
          {/* TILE 1: TIME TRACKER */}
          {showTimeTracker && (
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', ...tileStyle }}>
                <CardActionArea 
                  onClick={() => navigate("/my-time")}
                  sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
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

          {/* TILE 2: TEAM MONITOR */}
          {showTeamMonitor && (
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', ...tileStyle }}>
                <CardActionArea 
                  onClick={() => navigate("/team-monitor")}
                  sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                >
                  <GroupsIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Team Monitor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live εικόνα της ομάδας ({user.project}).
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          )}

          {/* TILE 3: NOVA FTTH */}
          {showNovaTool && (
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', ...tileStyle }}>
                <CardActionArea 
                  onClick={() => navigate("/nova")}
                  sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
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

          {/* TILE 4: SALES TOOLS */}
          {showSalesTools && (
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', ...tileStyle }}>
                <CardActionArea 
                  onClick={() => navigate("/nova/sales-tools")}
                  sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                >
                  <HandymanIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Sales Tools
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Links, Files & Contacts
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          )}

          {/* TILE 5: AGENT LOGS (MONO TEAM LEADERS) */}
          {showAgentLogs && (
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', ...tileStyle }}>
                <CardActionArea 
                  onClick={() => navigate("/team-logs")}
                  sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                >
                  <LogsIcon sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Agent Logs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ιστορικό συνδέσεων και export δεδομένων.
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          )}

          {/* ✅ ΝΕΟ TILE: MICROSOFT RESET PASSWORD (ΓΙΑ ΟΛΟΥΣ) */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
            <Card sx={{ width: '100%', ...tileStyle }}>
              <CardActionArea 
                href="https://passwordreset.microsoftonline.com/passwordreset#!/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <SecurityIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Password Reset
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Microsoft Reset Password (Every 2 months).
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>

          {/* ✅ ΝΕΟ TILE: MICROSOFT 365 COPILOT (ΓΙΑ ΟΛΟΥΣ) */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
            <Card sx={{ width: '100%', ...tileStyle }}>
              <CardActionArea 
                href="https://m365.cloud.microsoft/chat/?auth=2&origindomain=Office"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ height: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <AssistantIcon sx={{ fontSize: 80, color: 'info.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Microsoft Copilot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ο AI βοηθός της Microsoft (M365 Chat).
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;