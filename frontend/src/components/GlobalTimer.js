import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import { 
    PlayArrow, 
    Stop, 
    Coffee,
    AccessTime,
    NotificationsActive
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";

// Helper Format Time
const formatTime = (ms) => {
  if (!ms || ms < 0) ms = 0;
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ✅ ΟΡΙΟ ΕΙΔΟΠΟΙΗΣΗΣ: 7 ώρες και 50 λεπτά
const REMINDER_THRESHOLD = (7 * 60 * 60 * 1000) + (50 * 60 * 1000);

const GlobalTimer = () => {
  const location = useLocation();
  
  // State
  const [serverData, setServerData] = useState(null);
  const [liveWorkMs, setLiveWorkMs] = useState(0);
  const [liveBreakMs, setLiveBreakMs] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ State για το Popup Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [reminderShown, setReminderShown] = useState(false); 

  const hidePaths = ["/", "/my-time"];
  const shouldShow = !hidePaths.includes(location.pathname) && localStorage.getItem("token");

  // ✅ 1. Zητάμε άδεια για Notifications μόλις φορτώσει
  useEffect(() => {
    if (shouldShow && "Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, [shouldShow]);

  // ✅ 2. Συνάρτηση αποστολής Windows Notification
  const sendSystemNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Profferio Time Tracker", {
        body: "⏰ Μην ξεχάσεις να πατήσεις ΤΕΛΟΣ (Clock-out) πριν αποχωρήσεις!",
        icon: "/icons/Profferio.png", // Αν υπάρχει το favicon
        requireInteraction: true // Μένει στην οθόνη μέχρι να το κλείσει
      });
    }
  };

  // --- LOGIC ---
  const calculateTimes = useCallback(() => {
    if (!serverData) return;

    const { status, lastActionAt, storedWorkMs, storedBreakMs } = serverData;
    const now = Date.now();
    let elapsed = 0;

    if (status !== "CLOSED" && lastActionAt) {
        elapsed = now - new Date(lastActionAt).getTime();
    }

    let currentWork = storedWorkMs || 0;
    let currentBreak = storedBreakMs || 0;

    if (status === "WORKING") {
        currentWork += elapsed;
    } else if (status === "BREAK") {
        currentBreak += elapsed;
    }

    setLiveWorkMs(currentWork);
    setLiveBreakMs(currentBreak);

    // ✅ ΕΛΕΓΧΟΣ & TRIGGER NOTIFICATIONS
    if (status === "WORKING" && currentWork >= REMINDER_THRESHOLD && !reminderShown) {
        setReminderShown(true); // Κλείδωμα
        setOpenDialog(true);    // Άνοιγμα Popup στην οθόνη
        sendSystemNotification(); // Αποστολή Windows Notification
    }

  }, [serverData, reminderShown]); 

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/time/today");
      setServerData(res.data);
    } catch (err) {}
  };

  const handleAction = async (actionType) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/time/action", { action: actionType });
      setServerData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    if (shouldShow) {
        fetchData();
        const syncInterval = setInterval(fetchData, 3000); 
        return () => clearInterval(syncInterval);
    }
  }, [shouldShow]);

  useEffect(() => {
    calculateTimes();
  }, [serverData, calculateTimes]);

  useEffect(() => {
    if (!shouldShow) return;
    const interval = setInterval(() => calculateTimes(), 1000);
    return () => clearInterval(interval);
  }, [calculateTimes, shouldShow]);

  if (!shouldShow) return null;

  const status = serverData?.status || "CLOSED";

  // --- STYLES ---
  return (
    <>
    {/* HEADER BAR */}
    <Paper 
        elevation={4}
        sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            zIndex: 1300, 
            bgcolor: '#121212', 
            color: 'white',
            borderBottom: '2px solid',
            borderColor: status === "WORKING" ? 'primary.main' : status === "BREAK" ? 'warning.main' : 'grey.800',
            py: 1.5,
            px: { xs: 2, md: 4 },
            transition: '0.3s'
        }}
    >
        <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
            
            {/* LEFT: ACTIONS */}
            <Grid item xs={12} md={4} display="flex" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={1}>
                {status === "CLOSED" && (
                    <Button 
                        variant="contained" 
                        color="warning" 
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleAction("START")}
                        disabled={loading}
                    >
                        ΕΝΑΡΞΗ
                    </Button>
                )}

                {status === "WORKING" && (
                    <>
                        <Button 
                            variant="outlined" 
                            size="small"
                            sx={{ color: '#4fc3f7', borderColor: '#4fc3f7' }}
                            startIcon={<Coffee />}
                            onClick={() => handleAction("BREAK")}
                            disabled={loading}
                        >
                            ΔΙΑΛΕΙΜΜΑ
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error"
                            size="small"
                            startIcon={<Stop />}
                            onClick={() => handleAction("STOP")}
                            disabled={loading}
                        >
                            ΤΕΛΟΣ
                        </Button>
                    </>
                )}

                {status === "BREAK" && (
                    <Button 
                        variant="contained" 
                        color="success"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleAction("RESUME")}
                        disabled={loading}
                    >
                        ΣΥΝΕΧΕΙΑ
                    </Button>
                )}
            </Grid>

            {/* MIDDLE: TIMERS */}
            <Grid item xs={12} md={4} display="flex" justifyContent="center" alignItems="center" gap={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime color={status === "WORKING" ? "primary" : status === "BREAK" ? "warning" : "disabled"} />
                    <Typography variant="h6" fontFamily="monospace" fontWeight="bold" color="white">
                        {formatTime(liveWorkMs)}
                    </Typography>
                </Box>
                
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
                    <Typography variant="body2" color="grey.500">
                        BREAK: <span style={{ color: 'white', fontFamily: 'monospace' }}>{formatTime(liveBreakMs)}</span>
                    </Typography>
                    <Typography variant="body2" color="grey.500">
                        TOTAL: <span style={{ color: 'white', fontFamily: 'monospace' }}>{formatTime(liveWorkMs + liveBreakMs)}</span>
                    </Typography>
                </Box>
            </Grid>

            {/* RIGHT: STATUS */}
            <Grid item xs={12} md={4} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}>
                <Chip 
                    label={status === "WORKING" ? "ΕΡΓΑΣΙΑ" : status === "BREAK" ? "ΔΙΑΛΕΙΜΜΑ" : "CLOSED"} 
                    color={status === "WORKING" ? "primary" : status === "BREAK" ? "warning" : "default"}
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                />
            </Grid>

        </Grid>
    </Paper>

    {/* ✅ POPUP DIALOG (ΕΜΦΑΝΙΣΗ ΜΠΡΟΣΤΑ ΣΤΗΝ ΟΘΟΝΗ) */}
    <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
            sx: { 
                bgcolor: '#1e1e1e', 
                color: 'white', 
                border: '2px solid #0288d1',
                borderRadius: 2,
                p: 2
            }
        }}
    >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
            <NotificationsActive sx={{ fontSize: 40, color: '#0288d1' }} />
            <DialogTitle id="alert-dialog-title" sx={{ p: 0, fontWeight: 'bold' }}>
                Υπενθύμιση Ωραρίου
            </DialogTitle>
        </Box>
        <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ color: 'grey.300', fontSize: '1.1rem' }}>
                Μην ξεχάσεις να πατήσεις <strong>ΤΕΛΟΣ</strong> (Clock-out) πριν αποχωρήσεις!
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog} variant="contained" autoFocus>
                ΕΛΗΦΘΗ
            </Button>
        </DialogActions>
    </Dialog>

    {/* SPACER */}
    <Box sx={{ height: '80px' }} />
    </>
  );
};

export default GlobalTimer;