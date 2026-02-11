import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Grid,
  IconButton,
  Tooltip
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestartAltIcon from "@mui/icons-material/RestartAlt"; 
// ✅ Νέα Imports για τα κουμπιά
import { Refresh, LightMode, DarkMode, Logout } from "@mui/icons-material";

const AgentMonitor = ({ darkMode, setDarkMode }) => { 
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  
  // STATE ΓΙΑ ΤΑ ΦΙΛΤΡΑ
  const [filters, setFilters] = useState({
      agent: "",
      name: "",
      project: ""
  });

  const navigate = useNavigate();

  // ✅ LOGOUT FUNCTION (Για τον Admin που βλέπει τη σελίδα)
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

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/auth/open-sessions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSessions(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: "Αποτυχία λήψης δεδομένων.", severity: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceLogout = async (sessionId, userId) => {
    try {
      await axios.post(
        "/api/auth/force-logout",
        { 
            logId: sessionId, 
            userId: userId    
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSnackbar({ open: true, message: "Ο agent αποσυνδέθηκε!", severity: "success" });
      fetchSessions(); 
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Αποτυχία force logout.", severity: "error" });
    }
  };

  // LOGIC ΦΙΛΤΡΑΡΙΣΜΑΤΟΣ
  const filteredSessions = sessions.filter((session) => {
      const username = (session.username || session.userId?.username || "").toLowerCase();
      const fullName = (session.fullName || session.userId?.fullName || "").toLowerCase();
      const project = (session.project || session.userId?.project || "").toLowerCase();

      const filterAgent = filters.agent.toLowerCase();
      const filterName = filters.name.toLowerCase();
      const filterProject = filters.project.toLowerCase();

      return (
          username.includes(filterAgent) &&
          fullName.includes(filterName) &&
          project.includes(filterProject)
      );
  });

  const handleResetFilters = () => {
      setFilters({ agent: "", name: "", project: "" });
  };

  return (
    <Box p={2}>
      
      {/* ✅ HEADER: Τώρα με Flex Space-Between για να πάνε τα κουμπιά δεξιά */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        
        {/* ΑΡΙΣΤΕΡΑ: Τίτλος & Back Button */}
        <Box display="flex" alignItems="center" gap={2}>
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate("/admin")}
                variant="outlined"
                size="small"
            >
                Back
            </Button>
            <Typography variant="h5" fontWeight="bold">
                👀 Monitor Agents
            </Typography>
        </Box>

        {/* ✅ ΔΕΞΙΑ: Refresh, Theme, Logout */}
        <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Ανανέωση Δεδομένων">
                <IconButton onClick={fetchSessions} color="primary">
                    <Refresh />
                </IconButton>
            </Tooltip>

            <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
                <IconButton onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
            </Tooltip>

            <Tooltip title="Αποσύνδεση">
                <IconButton onClick={handleLogout} color="error">
                    <Logout />
                </IconButton>
            </Tooltip>
        </Box>
      </Box>

      {/* SECTION ΦΙΛΤΡΩΝ */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                  <TextField 
                      label="Agent (Username)" 
                      variant="outlined" 
                      size="small" 
                      fullWidth
                      value={filters.agent}
                      onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                  />
              </Grid>
              <Grid item xs={12} sm={4}>
                  <TextField 
                      label="Ονοματεπώνυμο" 
                      variant="outlined" 
                      size="small" 
                      fullWidth
                      value={filters.name}
                      onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  />
              </Grid>
              <Grid item xs={12} sm={3}>
                  <TextField 
                      label="Project" 
                      variant="outlined" 
                      size="small" 
                      fullWidth
                      value={filters.project}
                      onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                  />
              </Grid>
              <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end">
                  <Tooltip title="Καθαρισμός Φίλτρων">
                      <Button 
                          variant="text" 
                          color="secondary" 
                          onClick={handleResetFilters}
                          startIcon={<RestartAltIcon />}
                      >
                          Reset
                      </Button>
                  </Tooltip>
              </Grid>
          </Grid>
      </Paper>

      {/* TABLE */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
             <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Agent</strong></TableCell>
                <TableCell><strong>Ονοματεπώνυμο</strong></TableCell>
                <TableCell><strong>Project</strong></TableCell>
                <TableCell><strong>Ώρα Login</strong></TableCell>
                <TableCell><strong>Ενέργειες</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {sessions.length === 0 ? "Κανένα ενεργό session." : "Δεν βρέθηκαν αποτελέσματα με αυτά τα φίλτρα."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session._id} hover>
                    <TableCell>{session.username || session.userId?.username || "Unknown"}</TableCell>
                    <TableCell>{session.fullName || session.userId?.fullName || "-"}</TableCell>
                    <TableCell>{session.project || session.userId?.project || "-"}</TableCell>
                    <TableCell>
                      {session.loginAt ? dayjs(session.loginAt).format("DD/MM/YYYY HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleForceLogout(session._id, session.userId?._id || session.userId)}
                      >
                        Force Logout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentMonitor;