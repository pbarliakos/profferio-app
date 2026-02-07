import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  Box, Button, Typography, Paper, Grid, Container, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, CircularProgress
} from "@mui/material";
import { 
    PlayArrow, 
    Pause, 
    Stop, 
    Coffee, 
    Logout as LogoutIcon, 
    LightMode, 
    DarkMode,
    ArrowBackIosNew // ✅ Νέο εικονίδιο για την επιστροφή
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// Helper: Μετατροπή ms σε HH:MM:SS
const formatTime = (ms) => {
  if (!ms || ms < 0) ms = 0;
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const MyTimeNew = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  
  // ✅ Ανάγνωση χρήστη για το Header
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // State δεδομένων από Server
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State για το UI (τρέχοντες μετρητές)
  const [liveWorkMs, setLiveWorkMs] = useState(0);
  const [liveBreakMs, setLiveBreakMs] = useState(0);

  // History State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [history, setHistory] = useState([]);

  // --- 1. ΥΠΟΛΟΓΙΣΜΟΣ ΧΡΟΝΟΥ ---
  const calculateTimes = useCallback(() => {
    if (!serverData) return;

    const { status, lastActionAt, storedWorkMs, storedBreakMs } = serverData;
    const now = Date.now();
    let elapsed = 0;

    if (status !== "CLOSED" && lastActionAt) {
        elapsed = now - new Date(lastActionAt).getTime();
    }

    if (status === "WORKING") {
        setLiveWorkMs((storedWorkMs || 0) + elapsed);
        setLiveBreakMs(storedBreakMs || 0);
    } else if (status === "BREAK") {
        setLiveWorkMs(storedWorkMs || 0);
        setLiveBreakMs((storedBreakMs || 0) + elapsed);
    } else {
        setLiveWorkMs(storedWorkMs || 0);
        setLiveBreakMs(storedBreakMs || 0);
    }
  }, [serverData]);

  // --- 2. FETCH DATA ---
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/time/today");
      setServerData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`/api/time/history?month=${selectedMonth}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- 3. EFFECTS ---
  useEffect(() => {
    fetchData();
    fetchHistory();
  }, [selectedMonth]);

  useEffect(() => {
    calculateTimes();
  }, [serverData, calculateTimes]);

  useEffect(() => {
    const interval = setInterval(() => {
        calculateTimes();
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateTimes]);


  // --- 4. ACTIONS ---
  const handleAction = async (actionType) => {
    try {
      setLoading(true); 
      const res = await axios.post("/api/time/action", { action: actionType });
      setServerData(res.data); 
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Κάτι πήγε στραβά με την ενέργεια.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (serverData?.status !== "CLOSED") {
        await axios.post("/api/time/action", { action: "STOP" });
      }
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // --- ΝΕΟ EFFECT: Background Sync ---
  // Ρωτάει τον server κάθε 3 δευτερόλεπτα για αλλαγές από άλλες συσκευές
  useEffect(() => {
    const syncInterval = setInterval(async () => {
       try {
         // Προσοχή: Δεν θέλουμε να ενεργοποιούμε το loading spinner εδώ
         // γιατί θα αναβοσβήνει η σελίδα. Κάνουμε "σιωπηλό" fetch.
         const res = await axios.get("/api/time/today");
         
         // Ενημερώνουμε το state ΜΟΝΟ αν πάρουμε απάντηση
         // Το calculateTimes θα τρέξει αυτόματα επειδή εξαρτάται από το serverData
         setServerData(res.data);
       } catch (err) {
         console.error("Background sync failed", err);
       }
    }, 3000); // Κάθε 3 δευτερόλεπτα

    return () => clearInterval(syncInterval);
  }, []);

  // ✅ LOGIC: Back to Dashboard based on Role
  const handleBackClick = () => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
        navigate("/admin");
    } else {
        navigate("/dashboard");
    }
  };

  if (loading && !serverData) {
      return (
          <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
              <CircularProgress />
          </Box>
      );
  }

  const status = serverData?.status || "CLOSED";


  

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
      
      {/* ✅ NEW HEADER START */}
      <Box sx={{ bgcolor: 'background.paper', py: 1.5, px: 3, mb: 4, boxShadow: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* ΑΡΙΣΤΕΡΑ: Back Button & Title */}
            <Box display="flex" alignItems="center" gap={1}>
                <Box 
                    onClick={handleBackClick}
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
                    Time Tracker
                </Typography>
            </Box>

            {/* ΔΕΞΙΑ: User Info & Controls */}
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
      {/* ✅ NEW HEADER END */}

      <Container maxWidth="lg">
        {/* Main Stats Card */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }} elevation={3}>
            <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} sm={3}>
                <Typography variant="overline" color="text.secondary">STATUS</Typography>
                <Typography variant="h5" fontWeight="bold">
                {status === "WORKING" ? "Εργασία" : status === "BREAK" ? "Διάλειμμα" : "Εκτός"}
                </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
                <Typography variant="overline" color="text.secondary">WORKING TIME</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                {formatTime(liveWorkMs)}
                </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
                <Typography variant="overline" color="text.secondary">BREAK</Typography>
                <Typography variant="h5" fontWeight="bold">
                {formatTime(liveBreakMs)}
                </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
                <Typography variant="overline" color="text.secondary">TOTAL (WORK+BREAK)</Typography>
                <Typography variant="h5">
                {formatTime(liveWorkMs + liveBreakMs)}
                </Typography>
            </Grid>
            </Grid>

            {/* Buttons Control Panel */}
            <Box mt={4} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            {/* Κουμπιά όταν είναι CLOSED */}
            {status === "CLOSED" && (
                <Button 
                variant="contained" 
                color="warning" 
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => handleAction("START")}
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5 }}
                >
                {serverData?.firstLoginAt ? "ΕΠΑΝΑΝΟΙΓΜΑ" : "ΕΝΑΡΞΗ ΕΡΓΑΣΙΑΣ"}
                </Button>
            )}

            {/* Κουμπιά όταν είναι WORKING */}
            {status === "WORKING" && (
                <>
                <Button 
                    variant="outlined" 
                    color="info" 
                    size="large" 
                    startIcon={<Coffee />}
                    onClick={() => handleAction("BREAK")}
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                >
                    ΔΙΑΛΕΙΜΜΑ
                </Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    size="large" 
                    startIcon={<Stop />}
                    onClick={() => handleAction("STOP")}
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                >
                    ΤΕΛΟΣ ΗΜΕΡΑΣ
                </Button>
                </>
            )}

            {/* Κουμπιά όταν είναι BREAK */}
            {status === "BREAK" && (
                <Button 
                variant="contained" 
                color="success" 
                size="large" 
                startIcon={<PlayArrow />}
                onClick={() => handleAction("RESUME")}
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5 }}
                >
                ΤΕΛΟΣ ΔΙΑΛΕΙΜΜΑΤΟΣ
                </Button>
            )}
            </Box>
        </Paper>

        {/* History Section */}
        <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Ιστορικό Εργασίας</Typography>
            <TextField
            type="month"
            label="Μήνας"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            size="small"
            />
        </Box>

        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Ημερομηνία</TableCell>
                <TableCell>Εργασία</TableCell>
                <TableCell>Διάλειμμα</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Ωράριο</TableCell>
                <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {history.map((row) => (
                <TableRow key={row._id}>
                    <TableCell>{row.dateKey}</TableCell>
                    <TableCell>{formatTime(row.storedWorkMs)}</TableCell>
                    <TableCell>{formatTime(row.storedBreakMs)}</TableCell>
                    <TableCell>{formatTime(row.storedWorkMs + row.storedBreakMs)}</TableCell>
                    <TableCell>
                        {row.firstLoginAt ? new Date(row.firstLoginAt).toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'}) : '-'} 
                        {' - '} 
                        {row.lastLogoutAt ? new Date(row.lastLogoutAt).toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </TableCell>
                    <TableCell>
                    <Chip 
                        label={row.status} 
                        color={row.status === "CLOSED" ? "default" : "success"} 
                        size="small" 
                    />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default MyTimeNew;