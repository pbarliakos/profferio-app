import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  MenuItem,
  TextField,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

const API = process.env.REACT_APP_API_URL;


const LoginLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("/api/login-logs", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const logsWithFormatted = res.data.map((log) => ({
          ...log,
          id: log._id,
          loginFormatted: log.loginAt
            ? dayjs(log.loginAt).format("DD/MM/YYYY HH:mm")
            : "-",
          logoutFormatted: log.logoutAt
            ? dayjs(log.logoutAt).format("DD/MM/YYYY HH:mm")
            : "-",
        }));

        setLogs(logsWithFormatted);
        setFilteredLogs(logsWithFormatted);
      } catch (err) {
        console.error("❌ Failed to fetch login logs", err);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter((log) => {
      const loginDate = dayjs(log.loginAt);

      const userMatch =
        selectedUser === "" || log.username === selectedUser;

      const dateMatch =
        (!startDate || loginDate.isAfter(startDate.subtract(1, "day"))) &&
        (!endDate || loginDate.isBefore(endDate.add(1, "day")));

      return userMatch && dateMatch;
    });

    setFilteredLogs(filtered);
  }, [logs, selectedUser, startDate, endDate]);

  const userList = [...new Set(logs.map((log) => log.username))];

  const columns = [
    { field: "username", headerName: "Χρήστης", flex: 1 },
    { field: "fullName", headerName: "Ονοματεπώνυμο", flex: 1.5 },
    { field: "project", headerName: "Project", flex: 1 },
    { field: "loginFormatted", headerName: "Login", flex: 1.3 },
    { field: "logoutFormatted", headerName: "Logout", flex: 1.3 },
    {
      field: "duration",
      headerName: "Διάρκεια (λεπτά)",
      flex: 1,
      renderCell: (params) =>
        params?.row?.duration !== undefined ? params.row.duration : "-",
    },
  ];

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;

    const headers = [
      "Χρήστης",
      "Ονοματεπώνυμο",
      "Project",
      "Login",
      "Logout",
      "Διάρκεια (λεπτά)",
    ];

    const rows = filteredLogs.map((log) => [
      log.username,
      log.fullName,
      log.project,
      log.loginFormatted,
      log.logoutFormatted,
      log.duration ?? "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "login_logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStats = () => {
    const stats = {};

    filteredLogs.forEach((log) => {
      if (log.duration === undefined || log.logoutAt === undefined) return;

      const key = `${log.username}__${log.project}`;
      if (!stats[key]) {
        stats[key] = {
          username: log.username,
          project: log.project,
          totalMinutes: 0,
          sessions: 0,
        };
      }

      stats[key].totalMinutes += log.duration;
      stats[key].sessions += 1;
    });

    return Object.values(stats);
  };


  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post("/api/auth/logout", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("✅ Logout recorded on server");
      }
    } catch (err) {
      console.error("❌ Logout API failed", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box p={2}>
          {/* 🔝 User info + theme + logout */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">🔐 Login / Logout Logs</Typography>

            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">
                {user?.fullName} | {user?.username}
              </Typography>

              <Button
                variant="outlined"
                onClick={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                }}
              >
                {darkMode ? "LIGHT" : "DARK"}
              </Button>

  <Button
    variant="outlined"
    startIcon={<LogoutIcon />}
    color="error"
    onClick={handleLogout}
  >
    Logout
  </Button>
            </Box>
          </Box>

          {/* 🔍 Filters */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={5}>
              <TextField
                select
                fullWidth
                label="Χρήστης"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                sx={{ minWidth: 250 }}
              >
                <MenuItem value="">Όλοι</MenuItem>
                {userList.map((user) => (
                  <MenuItem key={user} value={user}>
                    {user}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Από"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="DD/MM/YYYY"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Έως"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="DD/MM/YYYY"
              />
            </Grid>
          </Grid>

          {/* 📋 Data Table */}
          <Paper elevation={3} sx={{ height: 600, p: 2 }}>
            <DataGrid
              rows={filteredLogs}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </Paper>

          {/* 📥 Export */}
          <Box display="flex" justifyContent="flex-end" my={2}>
            <Button variant="outlined" onClick={handleExportCSV}>
              📥 Εξαγωγή CSV
            </Button>
          </Box>

          {/* 📊 Stats */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              📊 Συγκεντρωτικά Στατιστικά (Φιλτραρισμένα)
            </Typography>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px" }}>Χρήστης</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Project</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Sessions</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Χρόνος (λεπτά)</th>
                </tr>
              </thead>
              <tbody>
                {getStats().map((row, index) => (
                  <tr key={index}>
                    <td style={{ padding: "8px" }}>{row.username}</td>
                    <td style={{ padding: "8px" }}>{row.project}</td>
                    <td style={{ padding: "8px" }}>{row.sessions}</td>
                    <td style={{ padding: "8px" }}>{row.totalMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default LoginLogs;