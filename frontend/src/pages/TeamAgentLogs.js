import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Typography, Button, Stack, Paper, 
  IconButton, Tooltip, Grid, Chip, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput
} from "@mui/material";
import { 
  DarkMode, LightMode, Logout, ArrowBack, FileDownload, FilterList
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/el"; 

// ✅ Helper: Μετατροπή ms σε HH:MM:SS
const msToHHMMSS = (ms) => {
  if (!ms || isNaN(ms)) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// Menu Props για το Dropdown (Στυλ όπως στο AdminTimeLogs)
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 400 }, // Πλάτος 400px όπως ζήτησες
  },
};

const TeamAgentLogs = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]); // Λίστα χρηστών για το Dropdown
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(null); 
  const [endDate, setEndDate] = useState(null);     
  const [selectedUsers, setSelectedUsers] = useState([]); // Επιλεγμένοι χρήστες
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout"); } 
    catch (err) { console.error(err); } 
    finally { localStorage.clear(); navigate("/"); }
  };

  // 1. Fetch Users
  const fetchUsers = async () => {
      try {
          const res = await axios.get("/api/time/team/users");
          setUsers(res.data || []);
      } catch (err) { console.error(err); }
  };

  // 2. Fetch Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const startStr = startDate ? dayjs(startDate).format("YYYY-MM-DD") : "";
      const endStr = endDate ? dayjs(endDate).format("YYYY-MM-DD") : "";
      
      const uParam = selectedUsers.length === 0 ? "all" : selectedUsers.join(",");

      const query = new URLSearchParams({
          startDate: startStr,
          endDate: endStr,
          userIds: uParam
      }).toString();

      const res = await axios.get(`/api/time/team/history?${query}`);
      setLogs(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [startDate, endDate, selectedUsers]);

  useEffect(() => {
     fetchUsers();
  }, []);

  useEffect(() => {
     fetchLogs();
  }, [fetchLogs]);

  const handleUserChange = (event) => {
    const { value } = event.target;
    if (value.includes("everyone")) {
        setSelectedUsers([]);
    } else {
        setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Ημερομηνία", "Ονοματεπώνυμο", "Project", "Έναρξη", "Λήξη", "Εργασία", "Διάλειμμα", "Σύνολο", "Status"];
    const rows = logs.map(log => [
      log.dateKey,
      log.userFullName || log.userId?.fullName || "-",
      log.userId?.project || "-",
      log.firstLoginAt ? dayjs(log.firstLoginAt).format("HH:mm:ss") : "-",
      log.lastLogoutAt ? dayjs(log.lastLogoutAt).format("HH:mm:ss") : "-",
      msToHHMMSS(log.storedWorkMs),
      msToHHMMSS(log.storedBreakMs),
      msToHHMMSS((log.storedWorkMs || 0) + (log.storedBreakMs || 0)),
      log.status
    ]);
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TeamTimeLogs_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <Box p={4} sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      
      {/* ✅ HEADER: ΙΔΙΟ ΜΕ ΤΟ ADMIN PANEL */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/dashboard")} sx={{ fontWeight: 600 }}>
            DASHBOARD
          </Button>
          <Typography variant="h4" fontWeight={800} color="text.primary">Team Logs</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ opacity: 0.8, color: 'text.secondary' }}>
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

      {/* FILTERS PANEL */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList color="action" />
            <Typography variant="h6" fontWeight="bold">Φίλτρα Αναζήτησης</Typography>
        </Box>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="el">
          <Grid container spacing={2} alignItems="center">
              
              {/* DATE FILTERS */}
              <Grid item xs={12} sm={6} md={3}>
                  <DatePicker 
                    label="Από" 
                    value={startDate} 
                    onChange={(newValue) => setStartDate(newValue)}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                  <DatePicker 
                    label="Έως" 
                    value={endDate} 
                    onChange={(newValue) => setEndDate(newValue)}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
              </Grid>

              {/* ✅ USER FILTER: ΑΚΡΙΒΩΣ ΟΠΩΣ ΣΤΟ ADMIN */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink id="users-label">Χρήστες</InputLabel>
                  <Select
                    labelId="users-label"
                    multiple
                    displayEmpty
                    value={selectedUsers}
                    onChange={handleUserChange}
                    input={<OutlinedInput label="Χρήστες" />}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                        if (selected.length === 0) return "Όλοι";
                        const selectedNames = users.filter(u => selected.includes(u._id)).map(u => u.fullName);
                        return selectedNames.join(", ");
                    }}
                  >
                    <MenuItem value="everyone">
                      <ListItemText primary="-- Όλοι --" sx={{ color: 'primary.main', fontWeight: 'bold' }} />
                    </MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        <Checkbox checked={selectedUsers.indexOf(u._id) > -1} />
                        <ListItemText primary={u.fullName} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* EXPORT BUTTON */}
              <Grid item xs={12} sm={6} md={3} display="flex" justifyContent="flex-end">
                   <Button 
                        variant="contained" 
                        color="success" 
                        size="large" 
                        startIcon={<FileDownload />} 
                        onClick={handleExportCSV} 
                        disabled={logs.length === 0}
                    >
                      Export Excel
                   </Button>
              </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* DATA GRID */}
      <Box sx={{ height: 650, width: '100%' }}>
        <DataGrid 
          rows={logs} 
          getRowId={r => r._id} 
          loading={loading}
          pageSizeOptions={[100, 50, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
          columns={[
            { field: "dateKey", headerName: "Ημερομηνία", width: 110 },
            { 
                field: "fullName", 
                headerName: "Ονοματεπώνυμο", 
                flex: 1, 
                minWidth: 200, 
                valueGetter: (params, row) => row.userFullName || row.userId?.fullName || "Deleted User" 
            },
            { 
                field: "project", 
                headerName: "Project", 
                width: 120, 
                valueGetter: (params, row) => row.userId?.project || "-" 
            },
            { 
                field: "firstLoginAt", 
                headerName: "Έναρξη", 
                width: 100, 
                renderCell: (p) => p.row.firstLoginAt ? dayjs(p.row.firstLoginAt).format("HH:mm") : "-" 
            },
            { 
                field: "lastLogoutAt", 
                headerName: "Λήξη", 
                width: 100, 
                renderCell: (p) => p.row.lastLogoutAt ? dayjs(p.row.lastLogoutAt).format("HH:mm") : "-" 
            },
            { 
                field: "work", 
                headerName: "Εργασία", 
                width: 110, 
                renderCell: (p) => msToHHMMSS(p.row.storedWorkMs) 
            },
            { 
                field: "break", 
                headerName: "Διάλειμμα", 
                width: 110, 
                renderCell: (p) => msToHHMMSS(p.row.storedBreakMs) 
            },
            { 
                field: "total", 
                headerName: "Σύνολο", 
                width: 110, 
                renderCell: (p) => msToHHMMSS((p.row.storedWorkMs || 0) + (p.row.storedBreakMs || 0)) 
            },
            { 
                field: "status", 
                headerName: "Status", 
                width: 120, 
                renderCell: (p) => (
                    <Chip 
                        label={p.row.status} 
                        color={p.row.status === "CLOSED" ? "default" : p.row.status === "WORKING" ? "primary" : "warning"}
                        size="small"
                        variant="filled"
                    />
                )
            }
          ]} 
          sx={{
              bgcolor: 'background.paper',
              '& .MuiDataGrid-columnHeaders': { bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' }
          }}
        />
      </Box>

    </Box>
  );
};

export default TeamAgentLogs;