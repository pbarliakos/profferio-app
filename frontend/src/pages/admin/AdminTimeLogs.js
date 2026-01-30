import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Typography, Button, Stack, TextField, MenuItem, Paper, 
  Select, OutlinedInput, Checkbox, ListItemText, FormControl, InputLabel,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from "@mui/material";
import { 
  DarkMode, LightMode, Logout, ArrowBack, FileDownload, Edit 
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs"; // Χρήσιμο για formatting ημερομηνιών

// --- HELPERS ---
const msToHHMMSS = (ms) => {
  if (!ms || isNaN(ms)) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const HHMMSStoMs = (timeString) => {
  if (!timeString) return 0;
  const parts = timeString.split(":");
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
};

// Μετατροπή Date object σε string για το input type="datetime-local" (YYYY-MM-DDTHH:mm)
const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    return dayjs(dateStr).format("YYYY-MM-DDTHH:mm");
};

const AdminTimeLogs = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null); 
  const [editForm, setEditForm] = useState({
      dateKey: "",
      status: "",
      workingTimeStr: "00:00:00",
      breakTimeStr: "00:00:00",
      firstLoginAt: "", // datetime-local format
      lastLogoutAt: ""  // datetime-local format
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const fetchActiveUsers = async () => {
      try {
        const res = await axios.get("/api/time/admin/active-users");
        setUsers(res.data.users || []);
      } catch (err) { console.error(err); }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const uParam = selectedUsers.length === 0 ? "all" : selectedUsers.join(",");
      const res = await axios.get(`/api/time/admin/logs?startDate=${startDate}&endDate=${endDate}&userIds=${uParam}`);
      setLogs(res.data.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [startDate, endDate, selectedUsers]);

  useEffect(() => {
     fetchActiveUsers();
     fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Ημερομηνία", "Χρήστης", "Έναρξη", "Λήξη", "Σύνολο", "Εργασία", "Διάλειμμα", "Status"];
    const rows = logs.map(log => [
      log.dateKey,
      log.userId?.fullName || "N/A",
      log.firstLoginAt ? dayjs(log.firstLoginAt).format("HH:mm:ss") : "-",
      log.lastLogoutAt ? dayjs(log.lastLogoutAt).format("HH:mm:ss") : "-",
      msToHHMMSS(log.workingMs + log.breakMs),
      msToHHMMSS(log.workingMs),
      msToHHMMSS(log.breakMs),
      log.status
    ]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TimeLogs_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    if (value.includes("everyone")) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
    }
  };

  // --- EDIT LOGIC ---
  const handleEditClick = (row) => {
     setCurrentLog(row);
     setEditForm({
         dateKey: row.dateKey,
         status: row.status,
         workingTimeStr: msToHHMMSS(row.workingMs || row.storedWorkMs),
         breakTimeStr: msToHHMMSS(row.breakMs || row.storedBreakMs),
         firstLoginAt: formatDateForInput(row.firstLoginAt),
         lastLogoutAt: formatDateForInput(row.lastLogoutAt)
     });
     setEditOpen(true);
  };

  const handleSaveEdit = async () => {
      try {
          const payload = {
              dateKey: editForm.dateKey,
              status: editForm.status,
              storedWorkMs: HHMMSStoMs(editForm.workingTimeStr),
              storedBreakMs: HHMMSStoMs(editForm.breakTimeStr),
              firstLoginAt: editForm.firstLoginAt, // Στέλνουμε το string (ISO format θα το κάνει η JS)
              lastLogoutAt: editForm.lastLogoutAt
          };

          await axios.put(`/api/time/admin/log/${currentLog._id}`, payload);
          setEditOpen(false);
          fetchLogs(); 
      } catch (err) {
          console.error("Update failed", err);
          alert("Update failed!");
      }
  };

  return (
    <Box p={4}>
      {/* HEADER */}
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
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ border: '1px solid', borderColor: 'divider' }}>
              {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={handleLogout} color="error" sx={{ border: '1px solid', borderColor: 'error.light' }}>
             <Logout fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* FILTERS */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={2} sx={{ mb: { xs: 2, md: 0 } }}>
            <TextField type="date" label="Από" InputLabelProps={{ shrink: true }} size="small" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <TextField type="date" label="Έως" InputLabelProps={{ shrink: true }} size="small" value={endDate} onChange={e => setEndDate(e.target.value)} />
            
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Χρήστες</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                onChange={handleSelectChange}
                input={<OutlinedInput label="Χρήστες" />}
                renderValue={(selected) => selected.length === 0 ? "Everyone" : users.filter(u => selected.includes(u._id)).map(u => u.fullName).join(", ")}
              >
                <MenuItem value="everyone"><ListItemText primary="-- Everyone --" sx={{ color: 'primary.main', fontWeight: 'bold' }} /></MenuItem>
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    <Checkbox checked={selectedUsers.indexOf(u._id) > -1} />
                    <ListItemText primary={u.fullName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportCSV} disabled={logs.length === 0}>
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* DATA GRID */}
      <Box sx={{ height: 650 }}>
        <DataGrid 
          rows={logs} 
          getRowId={r => r._id} 
          loading={loading}
          pageSizeOptions={[100, 50, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
          columns={[
            { field: "dateKey", headerName: "Ημερομηνία", width: 110 },
            { field: "user", headerName: "Χρήστης", flex: 1, valueGetter: (params, row) => row?.userId?.fullName || "N/A" },
            // ✅ Νέες Στήλες
            { field: "firstLogin", headerName: "Έναρξη", width: 90, renderCell: (p) => p.row.firstLoginAt ? dayjs(p.row.firstLoginAt).format("HH:mm") : "-" },
            { field: "lastLogout", headerName: "Λήξη", width: 90, renderCell: (p) => p.row.lastLogoutAt ? dayjs(p.row.lastLogoutAt).format("HH:mm") : "-" },
            
            { field: "working", headerName: "Εργασία", width: 100, renderCell: (p) => msToHHMMSS(p.row?.workingMs) },
            { field: "break", headerName: "Διάλειμμα", width: 100, renderCell: (p) => msToHHMMSS(p.row?.breakMs) },
            { field: "total", headerName: "Σύνολο", width: 100, renderCell: (p) => msToHHMMSS((p.row?.workingMs || 0) + (p.row?.breakMs || 0)) },
            { field: "status", headerName: "Status", width: 100 },
            { 
                field: "actions", 
                headerName: "Edit", 
                width: 70, 
                renderCell: (params) => (
                    <IconButton color="primary" onClick={() => handleEditClick(params.row)}>
                        <Edit />
                    </IconButton>
                )
            }
          ]} 
        />
      </Box>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Επεξεργασία Log</DialogTitle>
          <DialogContent dividers>
              <Grid container spacing={2} pt={1}>
                  <Grid item xs={6}>
                      <TextField 
                        label="Ημερομηνία" 
                        type="date" 
                        fullWidth 
                        value={editForm.dateKey}
                        onChange={(e) => setEditForm({...editForm, dateKey: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={editForm.status}
                            label="Status"
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          >
                              <MenuItem value="WORKING">WORKING</MenuItem>
                              <MenuItem value="BREAK">BREAK</MenuItem>
                              <MenuItem value="CLOSED">CLOSED</MenuItem>
                          </Select>
                      </FormControl>
                  </Grid>
                  
                  {/* ✅ Νέα Πεδία Edit */}
                  <Grid item xs={6}>
                      <TextField 
                        label="Ώρα Έναρξης" 
                        type="datetime-local" 
                        fullWidth 
                        InputLabelProps={{ shrink: true }}
                        value={editForm.firstLoginAt}
                        onChange={(e) => setEditForm({...editForm, firstLoginAt: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <TextField 
                        label="Ώρα Λήξης" 
                        type="datetime-local" 
                        fullWidth 
                        InputLabelProps={{ shrink: true }}
                        value={editForm.lastLogoutAt}
                        onChange={(e) => setEditForm({...editForm, lastLogoutAt: e.target.value})}
                      />
                  </Grid>

                  <Grid item xs={6}>
                      <TextField 
                        label="Χρόνος Εργασίας" 
                        fullWidth 
                        value={editForm.workingTimeStr}
                        onChange={(e) => setEditForm({...editForm, workingTimeStr: e.target.value})}
                        helperText="HH:MM:SS"
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <TextField 
                        label="Χρόνος Διαλείμματος" 
                        fullWidth 
                        value={editForm.breakTimeStr}
                        onChange={(e) => setEditForm({...editForm, breakTimeStr: e.target.value})}
                        helperText="HH:MM:SS"
                      />
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setEditOpen(false)} color="inherit">Ακύρωση</Button>
              <Button onClick={handleSaveEdit} variant="contained" color="primary">Αποθήκευση</Button>
          </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdminTimeLogs;