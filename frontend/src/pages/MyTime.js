import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Box, Button, Typography, Paper, Grid, Container, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip
} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from "react-router-dom";

// Helper για μετατροπή ms σε HH:MM:SS
const formatTime = (ms) => {
  if (!ms) ms = 0;
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const MyTime = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("CLOSED"); // CLOSED, WORKING, BREAK
  const [data, setData] = useState(null);
  
  // Counters για εμφάνιση (τρέχουν τοπικά)
  const [displayWork, setDisplayWork] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);
  
  // History Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [history, setHistory] = useState([]);

  // 1. Fetch Initial Data
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/time/today");
      updateStateFromDB(res.data);
    } catch (err) {
      console.error("Error fetching time data", err);
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

  // 2. Ενημέρωση state από DB response
  const updateStateFromDB = (dbDoc) => {
    setData(dbDoc);
    setStatus(dbDoc.status);
    
    // Υπολογισμός αρχικών τιμών βάσει DB
    if (dbDoc.status === "CLOSED") {
      setDisplayWork(dbDoc.storedWorkMs);
      setDisplayBreak(dbDoc.storedBreakMs);
    } else {
      // Αν είναι ενεργό, πρέπει να προσθέσουμε τον χρόνο που πέρασε
      const now = new Date().getTime();
      const lastAction = new Date(dbDoc.lastActionAt).getTime();
      const elapsed = now - lastAction;

      if (dbDoc.status === "WORKING") {
        setDisplayWork(dbDoc.storedWorkMs + elapsed);
        setDisplayBreak(dbDoc.storedBreakMs);
      } else if (dbDoc.status === "BREAK") {
        setDisplayWork(dbDoc.storedWorkMs);
        setDisplayBreak(dbDoc.storedBreakMs + elapsed);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, [selectedMonth]);

  // 3. Timer Ticking (Τρέχει κάθε δευτερόλεπτο μόνο για το UI)
  useEffect(() => {
    let interval;
    if (status === "WORKING" || status === "BREAK") {
      interval = setInterval(() => {
        if (data && data.lastActionAt) {
          const now = new Date().getTime();
          const lastAction = new Date(data.lastActionAt).getTime();
          const elapsed = now - lastAction;

          if (status === "WORKING") {
            setDisplayWork(data.storedWorkMs + elapsed);
          } else if (status === "BREAK") {
            setDisplayBreak(data.storedBreakMs + elapsed);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, data]);

  // 4. Actions
  const handleAction = async (actionType) => {
    try {
      const res = await axios.post("/api/time/action", { action: actionType });
      updateStateFromDB(res.data);
      fetchHistory(); // Ανανέωση ιστορικού
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      if (status !== "CLOSED") {
        await axios.post("/api/time/action", { action: "STOP" });
      }
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("project");
      navigate("/");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">Time Tracker</Typography>
        <Box>
            <Button variant="outlined" onClick={() => setDarkMode(!darkMode)} sx={{ mr: 2 }}>
               {darkMode ? "LIGHT" : "DARK"}
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
              LOGOUT
            </Button>
        </Box>
      </Box>

      {/* Main Stats Card */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }} elevation={3}>
        <Grid container spacing={4} alignItems="center">
          {/* ✅ ΔΙΟΡΘΩΣΗ: Αφαίρεση του 'item' και αλλαγή του 'xs' σε 'size' */}
          <Grid size={3}>
             <Typography variant="overline" color="text.secondary">STATUS</Typography>
             <Typography variant="h5" fontWeight="bold">
               {status === "WORKING" ? "Εργασία" : status === "BREAK" ? "Διάλειμμα" : "Εκτός"}
             </Typography>
          </Grid>
          <Grid size={3}>
             <Typography variant="overline" color="text.secondary">WORKING TIME</Typography>
             <Typography variant="h4" fontWeight="bold" color="primary.main">
               {formatTime(displayWork)}
             </Typography>
          </Grid>
          <Grid size={3}>
             <Typography variant="overline" color="text.secondary">BREAK</Typography>
             <Typography variant="h5" fontWeight="bold">
               {formatTime(displayBreak)}
             </Typography>
          </Grid>
          <Grid size={3}>
             <Typography variant="overline" color="text.secondary">TOTAL (WORK+BREAK)</Typography>
             <Typography variant="h5">
               {formatTime(displayWork + displayBreak)}
             </Typography>
          </Grid>
        </Grid>

        <Box mt={4} display="flex" gap={2}>
           {status === "CLOSED" && (
             <Button 
               variant="contained" 
               color="warning" 
               size="large"
               startIcon={<PlayArrowIcon />}
               onClick={() => handleAction("START")}
             >
               {data?.firstLoginAt ? "ΕΠΑΝΑΝΟΙΓΜΑ" : "ΕΝΑΡΞΗ ΕΡΓΑΣΙΑΣ"}
             </Button>
           )}

           {status === "WORKING" && (
             <>
               <Button 
                 variant="outlined" 
                 color="info" 
                 size="large" 
                 startIcon={<CoffeeIcon />}
                 onClick={() => handleAction("BREAK")}
               >
                 ΔΙΑΛΕΙΜΜΑ
               </Button>
               <Button 
                 variant="contained" 
                 color="warning" 
                 size="large" 
                 startIcon={<StopIcon />}
                 onClick={() => handleAction("STOP")}
               >
                 ΤΕΛΟΣ ΗΜΕΡΑΣ
               </Button>
             </>
           )}

           {status === "BREAK" && (
             <Button 
               variant="contained" 
               color="success" 
               size="large" 
               startIcon={<PlayArrowIcon />}
               onClick={() => handleAction("RESUME")}
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
              <TableCell>Total (Work+Break)</TableCell>
              <TableCell>Έναρξη / Λήξη</TableCell>
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
                    {row.firstLoginAt ? new Date(row.firstLoginAt).toLocaleTimeString('el-GR') : '-'} / 
                    {row.lastLogoutAt ? new Date(row.lastLogoutAt).toLocaleTimeString('el-GR') : '-'}
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
  );
};

export default MyTime;