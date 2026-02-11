import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  AppBar,
  Toolbar,
  Container,
  CircularProgress,
  IconButton
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { 
  Refresh, 
  ArrowBack, 
  Logout, 
  LightMode, 
  DarkMode,
  Person
} from "@mui/icons-material"; 
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom"; 

// --- HELPER FUNCTION ---
const msToHHMMSS = (ms) => {
  if (!ms || isNaN(ms) || ms < 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// --- 🔥 NEW LIVE TIMER COMPONENT ---
const LiveTimer = ({ initialMs, isActive, startTime }) => {
  const [displayTime, setDisplayTime] = useState(msToHHMMSS(initialMs));

  useEffect(() => {
    if (!isActive || !startTime) {
      setDisplayTime(msToHHMMSS(initialMs));
      return;
    }

    const update = () => {
      const now = dayjs();
      const start = dayjs(startTime);
      const diff = now.diff(start); 
      const total = (initialMs || 0) + diff;
      setDisplayTime(msToHHMMSS(total));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [initialMs, isActive, startTime]);

  return <span>{displayTime}</span>;
};


const TeamMonitor = ({ darkMode, setDarkMode }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  const fetchTeamData = useCallback(async () => {
    try {
      const res = await axios.get("/api/time/team-monitor");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching team logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
    const fetchInterval = setInterval(fetchTeamData, 60000); 
    return () => clearInterval(fetchInterval);
  }, [fetchTeamData]);


  const columns = [
    { 
      field: "fullName", 
      headerName: "Χρήστης", 
      flex: 1.5,
      renderCell: (params) => params.row?.userId?.fullName || "Άγνωστος"
    },
    { 
      field: "firstLoginAt", 
      headerName: "First Login", 
      flex: 1,
      renderCell: (params) => params.row?.firstLoginAt ? dayjs(params.row.firstLoginAt).format("HH:mm") : "-"
    },
    { 
      field: "lastLogoutAt", 
      headerName: "Last Logout", 
      flex: 1,
      renderCell: (params) => params.row?.lastLogoutAt ? dayjs(params.row.lastLogoutAt).format("HH:mm") : "-"
    },
    { 
      field: "workingMs", 
      headerName: "Εργασία", 
      flex: 1,
      // ✅ SORTING FIX: Επιστρέφουμε την καθαρή τιμή για sort
      valueGetter: (params, row) => {
          const baseMs = row?.storedWorkMs || row?.workingMs || 0;
          // Αν είναι active, προσθέτουμε τον χρόνο που πέρασε για πιο ακριβές sort (προαιρετικό)
          if (row?.status === 'WORKING' && row?.lastAction) {
              return baseMs + dayjs().diff(dayjs(row.lastAction));
          }
          return baseMs;
      },
      renderCell: (params) => (
        <LiveTimer 
          initialMs={params.row?.storedWorkMs || params.row?.workingMs || 0}
          isActive={params.row?.status === 'WORKING'}
          startTime={params.row?.lastAction}
        />
      )
    },
    { 
      field: "breakMs", 
      headerName: "Διάλειμμα", 
      flex: 1,
      // ✅ SORTING FIX
      valueGetter: (params, row) => {
          const baseMs = row?.storedBreakMs || row?.breakMs || 0;
          if (row?.status === 'BREAK' && row?.lastAction) {
              return baseMs + dayjs().diff(dayjs(row.lastAction));
          }
          return baseMs;
      },
      renderCell: (params) => (
        <LiveTimer 
          initialMs={params.row?.storedBreakMs || params.row?.breakMs || 0}
          isActive={params.row?.status === 'BREAK'}
          startTime={params.row?.lastAction}
        />
      )
    },
    { 
      field: "total", 
      headerName: "Σύνολο", 
      flex: 1,
      // ✅ SORTING FIX
      valueGetter: (params, row) => {
          const workStatic = row?.storedWorkMs || row?.workingMs || 0;
          const breakStatic = row?.storedBreakMs || row?.breakMs || 0;
          let total = workStatic + breakStatic;

          if ((row?.status === 'WORKING' || row?.status === 'BREAK') && row?.lastAction) {
             total += dayjs().diff(dayjs(row.lastAction));
          }
          return total;
      },
      renderCell: (params) => {
        const workStatic = params.row?.storedWorkMs || params.row?.workingMs || 0;
        const breakStatic = params.row?.storedBreakMs || params.row?.breakMs || 0;
        
        return (
          <LiveTimer 
             initialMs={workStatic + breakStatic}
             isActive={params.row?.status === 'WORKING' || params.row?.status === 'BREAK'}
             startTime={params.row?.lastAction}
          />
        );
      }
    },
    { 
      field: "status", 
      headerName: "Status", 
      flex: 1,
      renderCell: (params) => {
        const status = params.row?.status;
        let color = "default";
        if (status === "WORKING") color = "success";
        if (status === "BREAK") color = "warning";
        if (status === "CLOSED") color = "error";
        
        return <Chip label={status || "-"} color={color} size="small" variant="outlined" />;
      }
    }
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="default" elevation={1} sx={{ py: 1 }}>
        <Toolbar>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={() => navigate("/dashboard")}
              sx={{ mr: 2, fontWeight: 'bold' }}
              variant="outlined"
            >
              Dashboard
            </Button>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              Team Monitor <Chip label={user.project} size="small" color="primary" />
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" fontWeight="bold">
                        {user.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {user.role}
                    </Typography>
                </Box>
                <Person color="action" />

                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                    {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>

                <IconButton onClick={fetchTeamData} color="primary" title="Ανανέωση">
                    <Refresh />
                </IconButton>

                <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<Logout />} 
                    onClick={handleLogout}
                    size="small"
                >
                    Logout
                </Button>
            </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ height: "80vh", width: "100%", p: 2, borderRadius: 2 }}>
          {loading && logs.length === 0 ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
             </Box>
          ) : (
            <DataGrid
              rows={logs}
              columns={columns}
              getRowId={(row) => row._id}
              disableRowSelectionOnClick
              initialState={{
                  pagination: { paginationModel: { pageSize: 50 } },
              }}
              sx={{ border: 'none' }}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default TeamMonitor;