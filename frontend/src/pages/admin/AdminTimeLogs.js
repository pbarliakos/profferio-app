import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Typography, Button, Stack, TextField, MenuItem, Paper, 
  Select, OutlinedInput, Checkbox, ListItemText, FormControl, InputLabel,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from "@mui/material";
import { 
  DarkMode, LightMode, Logout, ArrowBack, FileDownload, Edit, FilterList
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

// ✅ Imports για το DatePicker (DD/MM/YYYY)
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/el"; 

// --- STATIC LISTS ---
const ALL_ROLES = ["admin", "manager", "user", "Backoffice", "Team Leader"];
const ALL_PROJECTS = ["alterlife", "nova", "admin", "time", "other", "Epic", "Instacar", "Nova FTTH"];
const ALL_COMPANIES = ["Othisi", "Infovest", "Infosale", "Korcavest", "Gemini", "Kontakt"];

// ✅ Ρυθμίσεις για το ύψος και πλάτος του Dropdown menu
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 400, 
    },
  },
};

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

const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    return dayjs(dateStr).format("YYYY-MM-DDTHH:mm");
};

const AdminTimeLogs = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [startDate, setStartDate] = useState(null); 
  const [endDate, setEndDate] = useState(null);     
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null); 
  const [editForm, setEditForm] = useState({
      dateKey: "",
      status: "",
      workingTimeStr: "00:00:00",
      breakTimeStr: "00:00:00",
      firstLoginAt: "",
      lastLogoutAt: ""
  });

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
      const rParam = selectedRoles.length === 0 ? "all" : selectedRoles.join(",");
      const pParam = selectedProjects.length === 0 ? "all" : selectedProjects.join(",");
      const cParam = selectedCompanies.length === 0 ? "all" : selectedCompanies.join(",");

      const startStr = startDate ? dayjs(startDate).format("YYYY-MM-DD") : "";
      const endStr = endDate ? dayjs(endDate).format("YYYY-MM-DD") : "";

      const query = new URLSearchParams({
          startDate: startStr,
          endDate: endStr,
          userIds: uParam,
          roles: rParam,
          projects: pParam,
          companies: cParam
      }).toString();

      const res = await axios.get(`/api/time/admin/logs?${query}`);
      setLogs(res.data.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [startDate, endDate, selectedUsers, selectedRoles, selectedProjects, selectedCompanies]);

  useEffect(() => {
      fetchActiveUsers();
      fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Ημερομηνία", "Χρήστης", "Εταιρεία", "Ρόλος", "Project", "Έναρξη", "Λήξη", "Σύνολο", "Εργασία", "Διάλειμμα", "Status"];
    const rows = logs.map(log => [
      log.dateKey,
      log.userId?.fullName || log.userFullName || "Deleted User",
      log.userCompany || log.userId?.company || "-", 
      log.userId?.role || "-",
      log.userId?.project || "-",
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

  const handleMultiSelectChange = (event, setter) => {
    const { value } = event.target;
    if (value.includes("everyone")) {
      setter([]); 
    } else {
      setter(typeof value === 'string' ? value.split(',') : value);
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
              firstLoginAt: editForm.firstLoginAt, 
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

      {/* FILTERS PANEL */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList color="action" />
            <Typography variant="h6" fontWeight="bold">Φίλτρα Αναζήτησης</Typography>
        </Box>
        
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="el">
          <Grid container spacing={2} alignItems="center">
              
              {/* ΗΜΕΡΟΜΗΝΙΕΣ */}
              <Grid item xs={12} sm={6} md={4}>
                  <DatePicker 
                    label="Από" 
                    value={startDate} 
                    onChange={(newValue) => setStartDate(newValue)}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                  <DatePicker 
                    label="Έως" 
                    value={endDate} 
                    onChange={(newValue) => setEndDate(newValue)}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
              </Grid>

              {/* USERS FILTER */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink id="users-label">Χρήστες</InputLabel>
                  <Select
                    labelId="users-label"
                    multiple
                    displayEmpty
                    value={selectedUsers}
                    onChange={(e) => handleMultiSelectChange(e, setSelectedUsers)}
                    input={<OutlinedInput label="Χρήστες" />}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                      if (selected.length === 0) return "Όλοι";
                      const names = users
                        .filter(u => selected.includes(u._id))
                        .map(u => u.fullName);
                      return names.join(", ");
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

              {/* ROLES FILTER */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink id="roles-label">Ρόλοι</InputLabel>
                  <Select
                    labelId="roles-label"
                    multiple
                    displayEmpty
                    value={selectedRoles}
                    onChange={(e) => handleMultiSelectChange(e, setSelectedRoles)}
                    input={<OutlinedInput label="Ρόλοι" />}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                      if (selected.length === 0) return "Όλοι";
                      return selected.join(", ");
                    }}
                  >
                    <MenuItem value="everyone">
                      <ListItemText primary="-- Όλοι --" sx={{ color: "primary.main", fontWeight: "bold" }} />
                    </MenuItem>
                    {ALL_ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Checkbox checked={selectedRoles.indexOf(role) > -1} />
                        <ListItemText primary={role} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* PROJECTS FILTER */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink id="projects-label">Projects</InputLabel>
                  <Select
                    labelId="projects-label"
                    multiple
                    displayEmpty
                    value={selectedProjects}
                    onChange={(e) => handleMultiSelectChange(e, setSelectedProjects)}
                    input={<OutlinedInput label="Projects" />}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                      if (selected.length === 0) return "Όλα";
                      return selected.join(", ");
                    }}
                  >
                    <MenuItem value="everyone">
                      <ListItemText primary="-- Όλα --" sx={{ color: "primary.main", fontWeight: "bold" }} />
                    </MenuItem>
                    {ALL_PROJECTS.map((proj) => (
                      <MenuItem key={proj} value={proj}>
                        <Checkbox checked={selectedProjects.indexOf(proj) > -1} />
                        <ListItemText primary={proj} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* COMPANIES FILTER */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink id="companies-label">Εταιρείες</InputLabel>
                  <Select
                    labelId="companies-label"
                    multiple
                    displayEmpty
                    value={selectedCompanies}
                    onChange={(e) => handleMultiSelectChange(e, setSelectedCompanies)}
                    input={<OutlinedInput label="Εταιρείες" />}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                      if (selected.length === 0) return "Όλες";
                      return selected.join(", ");
                    }}
                  >
                    <MenuItem value="everyone">
                      <ListItemText primary="-- Όλες --" sx={{ color: "primary.main", fontWeight: "bold" }} />
                    </MenuItem>
                    {ALL_COMPANIES.map((comp) => (
                      <MenuItem key={comp} value={comp}>
                        <Checkbox checked={selectedCompanies.indexOf(comp) > -1} />
                        <ListItemText primary={comp} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ACTION BUTTONS */}
              <Grid item xs={12} display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button variant="contained" color="success" size="large" startIcon={<FileDownload />} onClick={handleExportCSV} disabled={logs.length === 0}>
                       Export Excel
                    </Button>
              </Grid>
          </Grid>
        </LocalizationProvider>
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
            { field: "user", headerName: "Χρήστης", flex: 1, valueGetter: (params, row) => {return row?.userId?.fullName || row?.userFullName || "Deleted User";}},
            { field: "company", headerName: "Εταιρεία", width: 100, valueGetter: (params, row) => row.userCompany || row?.userId?.company || "-" },
            { field: "role", headerName: "Ρόλος", width: 100, valueGetter: (params, row) => row?.userId?.role || "-" },
            { field: "project", headerName: "Project", width: 100, valueGetter: (params, row) => row?.userId?.project || "-" },
            { field: "firstLogin", headerName: "Έναρξη", width: 90, renderCell: (p) => p.row.firstLoginAt ? dayjs(p.row.firstLoginAt).format("HH:mm") : "-" },
            { field: "lastLogout", headerName: "Λήξη", width: 90, renderCell: (p) => p.row.lastLogoutAt ? dayjs(p.row.lastLogoutAt).format("HH:mm") : "-" },
            
            // ✅ ΠΡΟΣΘΗΚΗ VALUEGETTER ΓΙΑ ΣΩΣΤΟ SORTING
            { 
              field: "working", 
              headerName: "Εργασία", 
              width: 100, 
              valueGetter: (params, row) => row?.workingMs || 0, // Επιστρέφει αριθμό (ms) για το sort
              renderCell: (p) => msToHHMMSS(p.row?.workingMs)   // Εμφανίζει κείμενο (HH:MM:SS)
            },
            { 
              field: "break", 
              headerName: "Διάλειμμα", 
              width: 100, 
              valueGetter: (params, row) => row?.breakMs || 0,
              renderCell: (p) => msToHHMMSS(p.row?.breakMs) 
            },
            { 
              field: "total", 
              headerName: "Σύνολο", 
              width: 100, 
              valueGetter: (params, row) => (row?.workingMs || 0) + (row?.breakMs || 0),
              renderCell: (p) => msToHHMMSS((p.row?.workingMs || 0) + (p.row?.breakMs || 0)) 
            },
            
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