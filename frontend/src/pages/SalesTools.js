import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Link,
  Divider,
  List,
  ListItem,
  ListItemIcon
} from "@mui/material";
import { 
  Link as LinkIcon, 
  Phone, 
  VideoCall, 
  Description,
  Logout as LogoutIcon,
  LightMode,
  DarkMode,
  ArrowBackIosNew,
  Security, // Για το Password Reset
  Assistant, // Για το Copilot
  SupportAgent // Για το IT Service Desk
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SalesTools = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Έλεγχος αν είναι Team Leader ή Admin για να δείξουμε το IT Service Desk
  const isTeamLeaderOrAdmin = user.role === "team leader" || user.role === "admin";

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  const LinkItem = ({ title, url, icon = <LinkIcon fontSize="small" />, color = 'primary.main' }) => (
    <ListItem disablePadding sx={{ mb: 1.5 }}>
      <ListItemIcon sx={{ minWidth: 35, color: color }}>{icon}</ListItemIcon>
      <Link 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        underline="hover" 
        sx={{ 
            fontSize: '0.95rem', 
            color: 'text.primary',
            '&:hover': { color: 'primary.main' }
        }}
      >
        {title}
      </Link>
    </ListItem>
  );

  // Στυλ για τα κουτιά
  const paperStyle = {
    p: 3,
    height: '100%', 
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    transition: '0.3s',
    '&:hover': { boxShadow: 6 }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      
      {/* HEADER */}
      <Box sx={{ bgcolor: 'background.paper', py: 1.5, px: 3, mb: 4, boxShadow: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <Box display="flex" alignItems="center" gap={1}>
                <Box 
                    onClick={() => navigate("/dashboard")}
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer', 
                        opacity: 0.6, 
                        transition: '0.2s',
                        '&:hover': { opacity: 1, color: 'primary.main' }
                    }}
                >
                    <ArrowBackIosNew sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="button" fontWeight="bold">DASHBOARD</Typography>
                </Box>
                <Typography sx={{ opacity: 0.3, mx: 1 }}>|</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                    Sales Tools
                </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="caption" sx={{ opacity: 0.7, textAlign: 'right', display: { xs: 'none', md: 'block' }, lineHeight: 1.2 }}>
                    {user.fullName} <br/>
                    <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{user.project}</span> | {user.role}
                </Typography>

                <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={darkMode ? <LightMode /> : <DarkMode />} 
                    onClick={() => setDarkMode(!darkMode)}
                    sx={{ borderRadius: 20, textTransform: 'none' }}
                >
                    {darkMode ? "Light" : "Dark"}
                </Button>

                <Button 
                    variant="contained" 
                    color="error" 
                    size="small"
                    startIcon={<LogoutIcon />} 
                    onClick={handleLogout}
                    sx={{ borderRadius: 20, textTransform: 'none', px: 3 }}
                >
                    Logout
                </Button>
            </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        
        {/* HERO IMAGE (Banner) */}
        <Paper 
            elevation={4} 
            sx={{ 
                mb: 5, 
                overflow: 'hidden', 
                borderRadius: 4, 
                height: { xs: 120, md: 220 }, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                position: 'relative'
            }}
        >
            <img 
                src="/icons/salestool.png" 
                alt="Sales Tools Banner" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
             <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.1)' }} />
        </Paper>


        {/* CONTENT GRID */}
        <Grid container spacing={3} alignItems="stretch">
          
          {/* Portals & Services */}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>Portals & Services</Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <LinkItem title="JIRA αίτηση για το Online" url="https://othisi.atlassian.net/servicedesk/customer/portal/8" />
                <LinkItem title="JIRA αίτηση για το CRM" url="https://othisi.atlassian.net/servicedesk/customer/portal/15" />
                <LinkItem title="JIRA αίτηση για το Business" url="#" />
                
                {/* ✅ ΝΕΑ LINKS MICROSOFT */}
                <Divider sx={{ my: 1, opacity: 0.5 }} />
                <LinkItem 
                    title="Microsoft Reset Password (Every 2 months)" 
                    url="https://passwordreset.microsoftonline.com/passwordreset#!/" 
                    icon={<Security fontSize="small" />}
                    color="warning.main"
                />
                <LinkItem 
                    title="Microsoft 365 Copilot" 
                    url="https://m365.cloud.microsoft/chat/?auth=2&origindomain=Office" 
                    icon={<Assistant fontSize="small" />}
                    color="info.main"
                />

                {/* ✅ IT SERVICE DESK (Μόνο για Team Leaders & Admins) */}
                {isTeamLeaderOrAdmin && (
                    <>
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <LinkItem 
                            title="IT Service Desk (Helpdesk)" 
                            url="https://helpdesk.othisisa.gr/" 
                            icon={<SupportAgent fontSize="small" />}
                            color="success.main"
                        />
                    </>
                )}
              </List>
            </Paper>
          </Grid>

          {/* SharePoint Lists */}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h6" color="error" fontWeight="bold" gutterBottom>Εκκρεμότητες (SharePoint)</Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <LinkItem 
                  title="Rejected List (Excel)" 
                  url="https://othisisa-my.sharepoint.com/:x:/r/personal/pvlachakis_othisisa_gr/Documents/%CE%95%CE%9A%CE%9A%CE%A1%CE%95%CE%9C%CE%9F%CE%A4%CE%97%CE%A4%CE%95%CE%A3%20NOVA/%CE%A6%CE%95%CE%92%CE%A1%CE%99%CE%9F%CE%A3%202025/E%CE%9A%CE%9A%CE%A1%CE%95%CE%9C%CE%9F%CE%A4%CE%97%CE%A4%CE%95%CE%A3%20REJECTED.xlsx?d=wd09ea03368a9489788815dd2364d7eca&csf=1&web=1&e=xSlcb0" 
                  icon={<Description color="error" />}
                />
                <LinkItem 
                  title="SIM Cards List (Excel)" 
                  url="https://othisisa-my.sharepoint.com/:x:/r/personal/pvlachakis_othisisa_gr/Documents/%CE%95%CE%9A%CE%9A%CE%A1%CE%95%CE%9C%CE%9F%CE%A4%CE%97%CE%A4%CE%95%CE%A3%20NOVA/%CE%A6%CE%95%CE%92%CE%A1%CE%99%CE%9F%CE%A3%202025/E%CE%9A%CE%9A%CE%A1%CE%95%CE%9C%CE%9F%CE%A4%CE%97%CE%A4%CE%95%CE%A3%20KA%CE%A1%CE%A4%CE%A9%CE%9D%20SIM.xlsx?d=w4112c14168754705891c235f5262e4de&csf=1&web=1&e=6VDgW7" 
                  icon={<Description color="primary" />}
                />
              </List>
            </Paper>
          </Grid>

          {/* Operational Tools */}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>Operational Tools</Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <LinkItem title="CCM Dialer" url="https://wind.ccmdialer.gr/CCMClient/CCM/main.php" />
                <LinkItem 
                    title="Matrix (SharePoint)" 
                    url="https://othisisa-my.sharepoint.com/:x:/g/personal/jduni_othisisa_gr/EbfPEgH5pU1PpE92p9rtnbUBcvRy-64PmJRg_WXykVt5MA?email=mspathari%40othisisa.gr&e=0rjSkX" 
                />
                <LinkItem title="Verification Email (Gov.gr)" url="https://www.broadband-assist.gov.gr/" />
                
                 <LinkItem 
                    title="Ad-Hoc Activities" 
                    url="https://othisisa-my.sharepoint.com/:x:/g/personal/kampntel_othisisa_gr/ESfA9hAflHBHrciaonO2qGEB5DwaWEHCMJNiWQxtERINeg?e=1zndyp" 
                />
              </List>
            </Paper>
          </Grid>

          {/* Files & Procedures */}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>Files & Procedures</Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <LinkItem 
                    title="ΜΗ ΕΜΠΟΡΙΚΑ NOVA" 
                    url="https://othisisa-my.sharepoint.com/:x:/g/personal/infosalesales_othisisa_gr/EaYl94kXzu5FgJa9PQqoLfQBL7Tr6ZHbMbPYpu_rLwVRDA" 
                    icon={<Description />}
                />
                <LinkItem 
                    title="Διαδικασίες (Folder)" 
                    url="https://othisisa-my.sharepoint.com/:f:/g/personal/jduni_othisisa_gr/Elu6_vCsBI5IpkrGjSqcQF8B6IkCPLpOUv3eYnnDSdKsjw" 
                    icon={<Description />}
                />
                <LinkItem 
                    title="Mobile Online" 
                    url="https://othisisa-my.sharepoint.com/:x:/r/personal/pkontolatis_othisisa_gr/_layouts/15/Doc.aspx?sourcedoc=%7B11F6A79A-15F0-4E8B-ADBB-B04DF45D6D05%7D&file=Mobile%20Online.xlsx&action=default&mobileredirect=true" 
                    icon={<Description />}
                />
              </List>
            </Paper>
          </Grid>

          {/* Meetings */}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h6" color="secondary" fontWeight="bold" gutterBottom>Training Meeting Rooms</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                  {[1, 2, 3, 4].map((num) => (
                      <Grid item xs={12} sm={6} md={3} key={num}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            color="inherit"
                            startIcon={<VideoCall color="secondary" />} 
                            href="#" 
                            target="_blank"
                            sx={{ 
                                justifyContent: 'flex-start', 
                                py: 1.5,
                                borderColor: 'rgba(0,0,0,0.12)',
                                '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(156, 39, 176, 0.04)' }
                            }}
                        >
                            Meeting Room {num}
                        </Button>
                      </Grid>
                  ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Contacts */}
          <Grid item xs={12}>
            <Paper sx={{ 
                ...paperStyle, 
                bgcolor: darkMode ? 'primary.900' : 'primary.main', 
                color: '#fff' 
            }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone /> Κινητά επικοινωνίας Sales Online
                </Typography>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 3 }} />
                
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>Manager</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">Ιωάννης Ντούνης</Typography>
                        <Typography variant="body2">6989595219</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>Supervisor</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">Μαρία Σπαθάρη</Typography>
                        <Typography variant="body2">6986318491</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>Supervisor</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">Ανδρέας Μπαμπότσης</Typography>
                        <Typography variant="body2">Teams</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>Team Leader / Trainer</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">Παναγιώτης Κοντολάτης</Typography>
                        <Typography variant="body2">6936542098</Typography>
                    </Grid>
                </Grid>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default SalesTools;