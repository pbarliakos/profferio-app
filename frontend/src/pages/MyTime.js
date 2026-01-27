import React, { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Box, Button, Card, CardContent, Divider, Stack, Typography, 
  CircularProgress, Alert, TextField, Paper 
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Logout, LightMode as LightModeIcon, DarkMode as DarkModeIcon, History as HistoryIcon } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DateTime } from "luxon";

// Helper για μετατροπή MS σε HH:MM:SS
function msToHHMMSS(ms) {
  if (!ms || ms < 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MyTime = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  
  // States για το τρέχον session
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());

  // States για το Ιστορικό
  const [history, setHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(DateTime.now().toFormat("yyyy-MM"));
  const [historyLoading, setHistoryLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("user")) || {};
  const { fullName, role } = userInfo;

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: "" });
    const token = localStorage.getItem("token");
    if (token) instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    return instance;
  }, []);

  // Ανάκτηση τρέχουσας ημέρας
  const refreshCurrentDay = useCallback(async () => {
    try {
      const res = await api.get("/api/time/day");
      setDaily(res.data.daily);
    } catch (e) {
      console.error("Fetch day error", e);
    }
  }, [api]);

  // Ανάκτηση Ιστορικού Μήνα
  const fetchHistory = useCallback(async (month) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/time/month?month=${month}`);
      setHistory(res.data.days || []);
    } catch (e) {
      setErr("Αποτυχία φόρτωσης ιστορικού");
    } finally {
      setHistoryLoading(false);
    }
  }, [api]);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshCurrentDay(), fetchHistory(selectedMonth)]);
      setLoading(false);
    };
    init();
  }, [refreshCurrentDay, fetchHistory, selectedMonth]);

  const liveTotals = useMemo(() => {
    if (!daily?.firstLoginAt) return { breakMs: 0, totalPresenceMs: 0, workingMs: 0 };
    const startMs = new Date(daily.firstLoginAt).getTime();
    const endMs = daily.status === "closed" && daily.lastLogoutAt ? new Date(daily.lastLogoutAt).getTime() : now;
    const totalPresenceMs = Math.max(0, endMs - startMs);
    let breakMs = daily.breakMs || 0;
    if (daily.breakOpenAt) {
      breakMs += Math.max(0, now - new Date(daily.breakOpenAt).getTime());
    }
    return { breakMs, totalPresenceMs, workingMs: Math.max(0, totalPresenceMs - breakMs) };
  }, [daily, now]);

  const handleAction = async (endpoint) => {
    setErr("");
    setActionLoading(true);
    try {
      await api.post(endpoint);
      await refreshCurrentDay();
      await fetchHistory(selectedMonth); // Refresh και τον πίνακα
    } catch (e) {
      setErr(e?.response?.data?.message || "Η ενέργεια απέτυχε");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) await axios.post("/api/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
    finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // Ορισμός Στηλών DataGrid
  const columns = [
    { field: "dateKey", headerName: "Ημερομηνία", flex: 1, minWidth: 120 },
    { 
      field: "workingMs", 
      headerName: "Εργασία", 
      flex: 1, 
      renderCell: (params) => msToHHMMSS(params.value) 
    },
    { 
      field: "breakMs", 
      headerName: "Διάλειμμα", 
      flex: 1, 
      renderCell: (params) => msToHHMMSS(params.value) 
    },
    { 
      field: "totalPresenceMs", 
      headerName: "Παρουσία", 
      flex: 1, 
      renderCell: (params) => msToHHMMSS(params.value) 
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      renderCell: (params) => (
        <Box sx={{ 
          color: params.value === "open" ? "success.main" : "text.secondary",
          fontWeight: "bold",
          textTransform: "uppercase",
          fontSize: "0.75rem"
        }}>
          {params.value}
        </Box>
      )
    },
  ];

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  const hasDay = !!daily?.firstLoginAt;
  const isClosed = daily?.status === "closed";
  const isOnBreak = !!daily?.breakOpenAt;
  const canWork = hasDay && !isClosed;

  return (
    <Box p={4} sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800} color="primary">Time Tracker</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">{fullName} | {role}</Typography>
          <Button
            variant="outlined"
            startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light" : "Dark"}
          </Button>
          <Button variant="outlined" startIcon={<Logout />} color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* TRACKER CARD */}
      <Card sx={{ borderRadius: 3, mb: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <CardContent sx={{ p: 4 }}>
          {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}
          <Stack direction="row" spacing={4} sx={{ flexWrap: "wrap", mb: 4 }}>
            <StatBox label="Status" value={!hasDay ? "Εκτός" : isClosed ? "Κλειστό" : isOnBreak ? "Διάλειμμα" : "Εργασία"} />
            <StatBox label="Working Time" value={msToHHMMSS(liveTotals.workingMs)} highlight />
            <StatBox label="Break" value={msToHHMMSS(liveTotals.breakMs)} />
            <StatBox label="Presence" value={msToHHMMSS(liveTotals.totalPresenceMs)} />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => handleAction("/api/time/login")} disabled={canWork || actionLoading}>
              {hasDay ? "Επανανοιγμα" : "Εναρξη Ημερας"}
            </Button>
            <Button variant="outlined" size="large" onClick={() => handleAction(isOnBreak ? "/api/time/break/end" : "/api/time/break/start")} disabled={!canWork || actionLoading}>
              {isOnBreak ? "Τελος Διαλειμματος" : "Διαλειμμα"}
            </Button>
            <Button variant="contained" color="warning" size="large" onClick={() => handleAction("/api/time/logout")} disabled={!canWork || actionLoading}>
              Τελος Ημερας
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* HISTORY SECTION */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon color="action" />
            <Typography variant="h6" fontWeight={700}>Ιστορικό Εργασίας</Typography>
          </Stack>
          
          <TextField
            label="Μήνας"
            type="month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
        </Box>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={history}
            columns={columns}
            getRowId={(row) => row._id}
            loading={historyLoading}
            pageSizeOptions={[50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 31 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

const StatBox = ({ label, value, highlight }) => (
  <Box sx={{ minWidth: 140 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>{label}</Typography>
    <Typography variant="h5" fontWeight={highlight ? 800 : 500} color={highlight ? "primary.main" : "text.primary"}>
      {value}
    </Typography>
  </Box>
);

export default MyTime;