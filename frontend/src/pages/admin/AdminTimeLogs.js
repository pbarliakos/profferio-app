import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Typography, Button, Stack, TextField, MenuItem, Paper, 
  Select, OutlinedInput, Checkbox, ListItemText, FormControl, InputLabel,
  IconButton, Tooltip
} from "@mui/material";
import { 
  DarkMode, LightMode, Logout, ArrowBack, FileDownload 
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminTimeLogs = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

const msToHHMMSS = (ms) => {
  if (ms == null) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};


  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Εξαγωγή σε CSV (Excel συμβατό)
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Ημερομηνία", "Χρήστης", "Σύνολο", "Εργασία", "Διάλειμμα", "Status"];
    const rows = logs.map(log => [
      log.dateKey,
      log.userId?.fullName || "N/A",
      msToHHMMSS(log.totalPresenceMs),
      msToHHMMSS(log.workingMs),
      msToHHMMSS(log.breakMs),
      log.status
    ]);

    const csvContent = [
      headers.join(";"), 
      ...rows.map(r => r.join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TimeLogs_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    axios.get("/api/time/admin/active-users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data.users || []))
      .catch(err => console.error(err));
  }, [token]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Αν δεν υπάρχει επιλογή ή είναι "Everyone", στέλνουμε "all"
      const uParam = selectedUsers.length === 0 ? "all" : selectedUsers.join(",");
      const res = await axios.get(`/api/time/admin/logs?startDate=${startDate}&endDate=${endDate}&userIds=${uParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [startDate, endDate, selectedUsers, token]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSelectChange = (event) => {
    const { value } = event.target;
    // Αν πατηθεί το "Everyone", καθαρίζουμε τις επιλογές (που σημαίνει "Όλοι")
    if (value.includes("everyone")) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
    }
  };

  return (
    <Box p={4}>
      {/* HEADER SECTION - Πλήρης έλεγχος όπως στις άλλες σελίδες */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/admin")} sx={{ fontWeight: 600 }}>
            DASHBOARD
          </Button>
          <Typography variant="h4" fontWeight={800}>Team Logs</Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {user.fullName} | {user.role}
          </Typography>
          
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit" sx={{ border: '1px solid', borderColor: 'divider' }}>
              {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} color="error" sx={{ border: '1px solid', borderColor: 'error.light' }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* FILTERS & EXPORT SECTION */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <TextField type="date" label="Από" InputLabelProps={{ shrink: true }} size="small" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <TextField type="date" label="Έως" InputLabelProps={{ shrink: true }} size="small" value={endDate} onChange={e => setEndDate(e.target.value)} />
            
            <FormControl sx={{ minWidth: 250 }} size="small">
              <InputLabel>Χρήστες με εγγραφές</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                onChange={handleSelectChange}
                input={<OutlinedInput label="Χρήστες με εγγραφές" />}
                renderValue={(selected) => selected.length === 0 ? "Everyone" : users.filter(u => selected.includes(u._id)).map(u => u.fullName).join(", ")}
              >
                <MenuItem value="everyone">
                  <ListItemText primary="-- Everyone --" sx={{ color: 'primary.main', fontWeight: 'bold' }} />
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    <Checkbox checked={selectedUsers.indexOf(u._id) > -1} />
                    <ListItemText primary={u.fullName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button 
            variant="contained" 
            color="success" 
            startIcon={<FileDownload />} 
            onClick={handleExportCSV}
            disabled={logs.length === 0}
          >
            Export to Excel
          </Button>
        </Stack>
      </Paper>

      {/* DATA GRID */}
      <Box sx={{ height: 650 }}>
        <DataGrid 
          rows={logs} 
          columns={[
            { field: "dateKey", headerName: "Ημερομηνία", width: 130 },
            { 
              field: "user", 
              headerName: "Χρήστης", 
              flex: 1, 
              valueGetter: (value, row) => row?.userId?.fullName || "N/A" 
            },
            { field: "presence", headerName: "Σύνολο", width: 120, renderCell: (p) => msToHHMMSS(p.row?.totalPresenceMs) },
            { field: "working", headerName: "Εργασία", width: 120, renderCell: (p) => msToHHMMSS(p.row?.workingMs) },
            { field: "break", headerName: "Διάλειμμα", width: 120, renderCell: (p) => msToHHMMSS(p.row?.breakMs) },
            { field: "status", headerName: "Status", width: 100 }
          ]} 
          getRowId={r => r._id} 
          loading={loading}
          pageSizeOptions={[100, 50, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminTimeLogs;