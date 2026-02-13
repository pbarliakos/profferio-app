import React from "react"; 
import { 
  Box, 
  Typography, 
  Card, 
  CardActionArea, 
  Grid, 
  Button,
  useTheme,
  IconButton,
  Tooltip
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
  Security as SecurityIcon, 
  Assistant as AssistantIcon, 
  SupportAgent as SupportIcon
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
  
  const allTiles = [
    {
      title: "Time Tracker",
      desc: "Καταγραφή ωρών & διαλειμμάτων.",
      icon: <AccessTimeIcon sx={{ fontSize: 50 }} />,
      color: "primary.main",
      action: () => navigate("/my-time"),
      show: true
    },
    {
      title: "Team Monitor",
      desc: `Live εικόνα της ομάδας (${user.project}).`,
      icon: <GroupsIcon sx={{ fontSize: 50 }} />,
      color: "success.main",
      action: () => navigate("/team-monitor"),
      show: userRole === "team leader"
    },
    {
      title: "FTTH Coupon Email",
      desc: "Αποστολή email κουπονιών Nova.",
      icon: <EmailIcon sx={{ fontSize: 50 }} />,
      color: "#9c27b0",
      action: () => navigate("/nova"),
      show: projectLower.includes("nova")
    },
    {
      title: "Sales Tools",
      desc: "Links, Files & Contacts.",
      icon: <HandymanIcon sx={{ fontSize: 50 }} />,
      color: "secondary.main",
      action: () => navigate("/nova/sales-tools"),
      show: projectLower === "nova" || userRole === "backoffice"
    },
    {
      title: "Agent Logs",
      desc: "Ιστορικό συνδέσεων & export.",
      icon: <LogsIcon sx={{ fontSize: 50 }} />,
      color: "#ff9800",
      action: () => navigate("/team-logs"),
      show: userRole === "team leader"
    },
    {
      title: "Password Reset",
      desc: "Microsoft Reset (Every 2 months).",
      icon: <SecurityIcon sx={{ fontSize: 50 }} />,
      color: "warning.main",
      external: true,
      link: "https://passwordreset.microsoftonline.com/passwordreset#!/" ,
      show: true
    },
    {
      title: "Microsoft Copilot",
      desc: "AI βοηθός (M365 Chat).",
      icon: <AssistantIcon sx={{ fontSize: 50 }} />,
      color: "info.main",
      external: true,
      link: "https://m365.cloud.microsoft/chat/?auth=2&origindomain=Office",
      show: true
    },
    {
      title: "IT Helpdesk",
      desc: "Αναφορά τεχνικών προβλημάτων.",
      icon: <SupportIcon sx={{ fontSize: 50 }} />,
      color: "#e91e63",
      action: () => navigate("/tickets"),
      show: true
    }
  ];

  const visibleTiles = allTiles.filter(tile => tile.show);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 8, pb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* Width 90% για να μην απλώνει τέρμα στις άκρες σε τεράστιες οθόνες */}
      <Box sx={{ width: "90%", maxWidth: "1600px" }}>
        
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={5} borderBottom={1} borderColor="divider" pb={2}>
          <Box display="flex" alignItems="center" gap={2}>
             <DashboardIcon fontSize="large" color="primary" />
             <Typography variant="h4" fontWeight="800">
               Dashboard
             </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="subtitle2" sx={{ opacity: 0.7, display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
              {user.fullName} | <strong>{user.project}</strong>
            </Typography>

            <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                    {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
            </Tooltip>

            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<LogoutIcon />} 
              onClick={handleLogout}
              size="small"
              sx={{ borderRadius: 2, fontWeight: 'bold' }}
            >
              LOGOUT
            </Button>
          </Box>
        </Box>

        {/* ✅ GRID LAYOUT: ΑΥΣΤΗΡΑ 4 TILES */}
        <Grid container spacing={3} justifyContent="center">
          {visibleTiles.map((tile, index) => (
            // xs=12 (1 ανά σειρά σε κινητά)
            // sm=6  (2 ανά σειρά σε tablet)
            // md=4  (3 ανά σειρά σε μικρά laptop)
            // lg=3  (4 ανά σειρά σε desktop - 12/3 = 4)
            // xl=3  (4 ανά σειρά σε πολύ μεγάλες οθόνες)
            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={index}>
              <Card 
                sx={{ 
                  width: '100%', 
                  height: 240, // Σταθερό ύψος
                  borderRadius: 3, 
                  transition: '0.2s',
                  bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                  boxShadow: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 8, borderColor: 'primary.main' } 
                }}
              >
                <CardActionArea 
                  onClick={tile.external ? undefined : tile.action}
                  href={tile.external ? tile.link : undefined}
                  target={tile.external ? "_blank" : undefined}
                  rel={tile.external ? "noopener noreferrer" : undefined}
                  sx={{ 
                    flexGrow: 1, 
                    p: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center' 
                  }}
                >
                  <Box sx={{ color: tile.color, mb: 1.5, p: 1.5, borderRadius: '50%', bgcolor: darkMode ? 'rgba(255,255,255,0.03)' : '#f9f9f9' }}>
                    {tile.icon}
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                    {tile.title}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ px: 1, lineHeight: 1.4, fontSize: '0.85rem' }}>
                    {tile.desc}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Box>
    </Box>
  );
};

export default UserDashboard;