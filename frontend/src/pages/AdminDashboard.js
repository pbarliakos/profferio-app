import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  MenuItem,
  Paper,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Delete,
  Edit,
  Add,
  Logout,
  OpenInNew as OpenInNewIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  Workspaces as WorkspacesIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ 1. ΑΛΛΑΓΗ ΕΔΩ: Προσθέσαμε το property 'external'
const projectButtons = [
  { label: "Time Tracker", path: "/My-Time", external: false },
   { label: "Helpdesk", path: "/Tickets", external: false },
  { label: "Nova FTTH email", path: "/nova", external: false },
  { label: "Agent Monitor", path: "/admin/AgentMonitor", external: false },
  { label: "Login Logs", path: "/admin/loginlogs", external: false },
  { label: "Time Tracker Report", path: "/admin/timelogs", external: false },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isBlank = (v) => !v || !String(v).trim();

const sanitizeUserPayload = (u) => ({
  ...u,
  fullName: (u.fullName || "").trim(),
  username: (u.username || "").trim(),
  email: (u.email || "").trim(),
  company: (u.company || "").trim(),
});

const getApiErrorMessage = (err) => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error;

  if (status === 409) return msg || "Ο χρήστης υπάρχει ήδη.";
  if (status === 400) return msg || "Λείπουν υποχρεωτικά πεδία ή υπάρχουν λάθος τιμές.";
  if (status === 401) return "Η συνεδρία έληξε. Κάνε ξανά login.";
  return msg || "Σφάλμα κατά την αποθήκευση.";
};

const AdminDashboard = ({ darkMode, setDarkMode }) => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const [newUser, setNewUser] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "user",
    project: "alterlife",
    company: "Othisi",
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("user")) || {};
  const { fullName, role } = userInfo;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const projects = users.reduce((acc, user) => {
      acc[user.project] = (acc[user.project] || 0) + 1;
      return acc;
    }, {});
    const roles = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return { total, projects, roles };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.username} ${u.fullName} ${u.email} ${u.company || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setFieldErrors({});
    setNewUser({
      ...user,
      company: user.company || "Othisi",
      password: "",
    });
    setOpenDialog(true);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Σίγουρα θες να διαγράψεις τον χρήστη;")) return;
    await axios.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSnackbar("Ο χρήστης διαγράφηκε");
    fetchUsers();
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFieldErrors({});
  };

  const handleSave = async () => {
    try {
      setFieldErrors({});
      const payload = sanitizeUserPayload(newUser);
      const errors = {};
      
      if (isBlank(payload.fullName)) errors.fullName = "Υποχρεωτικό πεδίο.";
      if (isBlank(payload.username)) errors.username = "Υποχρεωτικό πεδίο.";
      if (isBlank(payload.email)) errors.email = "Υποχρεωτικό πεδίο.";
      if (!isBlank(payload.email) && !emailRegex.test(payload.email))
        errors.email = "Μη έγκυρο email.";
      if (isBlank(payload.company)) errors.company = "Υποχρεωτικό πεδίο.";

      if (!editingUser && isBlank(newUser.password)) {
        errors.password = "Υποχρεωτικό πεδίο.";
      }

      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        setSnackbar("Διόρθωσε τα υποχρεωτικά πεδία.");
        return;
      }

      const finalPayload = { ...payload };
      if (editingUser && isBlank(newUser.password)) {
        delete finalPayload.password;
      } else {
        finalPayload.password = newUser.password;
      }

      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, finalPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar("Ο χρήστης ενημερώθηκε");
      } else {
        await axios.post("/api/users", finalPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar("Ο χρήστης δημιουργήθηκε");
      }

      closeDialog();
      fetchUsers();
    } catch (err) {
      setSnackbar(getApiErrorMessage(err));
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post("/api/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  const handleExport = () => {
    if (!users.length) return;
    const headers = ["Full Name", "Username", "Email", "Role", "Project", "Company"];
    const rows = users.map((u) => [u.fullName, u.username, u.email, u.role, u.project, u.company || "-"]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((field) => `"${field}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo(
    () => [
      { field: "fullName", headerName: "Ονοματεπώνυμο", flex: 1 },
      { field: "username", headerName: "Username", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "company", headerName: "Εταιρεία", flex: 1 },
      { field: "role", headerName: "Ρόλος", flex: 1 },
      { field: "project", headerName: "Project", flex: 1 },
      {
        field: "actions",
        headerName: "Ενέργειες",
        renderCell: (params) => (
          <Box>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleEdit(params.row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(params.row._id)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        ),
        width: 150,
      },
    ],
    [handleEdit]
  );

  return (
    <Box p={4}>
      {/* HEADER SECTION */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800}>
          Admin Dashboard
        </Typography>

        {role === "admin" && (
          <Stack direction="row" spacing={2}>
            {projectButtons.map((btn) => (
              <Button
                key={btn.path}
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon />}
                // ✅ 2. ΑΛΛΑΓΗ ΕΔΩ: Έλεγχος αν είναι external ή internal
                onClick={() => {
                   if (btn.external) {
                      // Νέο Tab
                      window.open(btn.path, "_blank"); 
                   } else {
                      // Ίδιο Tab (React Router)
                      navigate(btn.path); 
                   }
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Stack>
        )}

        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {fullName} | {role}
          </Typography>
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

      {/* STATS SECTION */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={4}>
        <StatCard title="Σύνολο Χρηστών" value={stats.total} icon={<PeopleIcon color="primary" />} bgcolor="#e3f2fd" />
        <StatCard
          title="Χρήστες ανά Project"
          value={Object.entries(stats.projects).map(([k, v]) => `${k}: ${v}`).join(", ")}
          icon={<WorkspacesIcon color="secondary" />}
          bgcolor="#f3e5f5"
        />
        <StatCard
          title="Χρήστες ανά Ρόλο"
          value={Object.entries(stats.roles).map(([k, v]) => `${k}: ${v}`).join(", ")}
          icon={<GroupsIcon color="success" />}
          bgcolor="#e8f5e9"
        />
      </Box>

      {/* CONTROLS SECTION */}
      <Box display="flex" gap={2} mb={2}>
        <TextField label="Αναζήτηση" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingUser(null);
            setFieldErrors({});
            setNewUser({
              fullName: "",
              username: "",
              email: "",
              password: "",
              role: "user",
              project: "alterlife",
              company: "Othisi",
            });
            setOpenDialog(true);
          }}
          sx={{ minWidth: 180 }}
        >
          Νεος Χρηστης
        </Button>
        <Button variant="outlined" onClick={handleExport} sx={{ minWidth: 150 }}>
          Export Users
        </Button>
      </Box>

      {/* DATAGRID */}
      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row._id}
          autoHeight
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* DIALOG CREATE/EDIT */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? "Επεξεργασία Χρήστη" : "Νέος Χρήστης"}</DialogTitle>
        <DialogContent>
          <TextField
            id="fullName"
            label="Ονοματεπώνυμο"
            fullWidth
            margin="dense"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            error={!!fieldErrors.fullName}
            helperText={fieldErrors.fullName}
          />
          <TextField
            id="username"
            label="Username"
            fullWidth
            margin="dense"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
          />
          <TextField
            id="email"
            label="Email"
            fullWidth
            margin="dense"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
          />
          <TextField
            id="password"
            label="Password"
            fullWidth
            margin="dense"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            error={!!fieldErrors.password}
            helperText={editingUser ? "Άφησέ το κενό αν δεν θες να αλλάξει." : fieldErrors.password}
          />
          <TextField
            select
            label="Εταιρεία"
            fullWidth
            margin="dense"
            value={newUser.company}
            onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
            error={!!fieldErrors.company}
            helperText={fieldErrors.company}
          >
            <MenuItem value="Othisi">Othisi</MenuItem>
            <MenuItem value="Infovest">Infovest</MenuItem>
            <MenuItem value="Infosale">Infosale</MenuItem>
            <MenuItem value="Korcavest">Korcavest</MenuItem>
            <MenuItem value="Gemini">Gemini</MenuItem>
            <MenuItem value="Kontakt">Kontakt</MenuItem>
          </TextField>
          <TextField
            select
            label="Ρόλος"
            fullWidth
            margin="dense"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="manager">manager</MenuItem>
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="backoffice">backoffice</MenuItem>
            <MenuItem value="team leader">team leader</MenuItem>
          </TextField>
          <TextField
            select
            label="Project"
            fullWidth
            margin="dense"
            value={newUser.project}
            onChange={(e) => setNewUser({ ...newUser, project: e.target.value })}
          >
            <MenuItem value="alterlife">alterlife</MenuItem>
            <MenuItem value="nova">nova</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="time">timetrack</MenuItem>
            <MenuItem value="other">other</MenuItem>
            <MenuItem value="epic">epic</MenuItem>
            <MenuItem value="instacar">instacar</MenuItem>
            <MenuItem value="nova ftth">nova ftth</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Άκυρο</Button>
          <Button variant="contained" onClick={handleSave}>
            Αποθήκευση
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={3000} message={snackbar} onClose={() => setSnackbar("")} />
    </Box>
  );
};

const StatCard = ({ title, value, icon, bgcolor }) => (
  <Paper sx={{ flex: 1, minWidth: 220, p: 3, display: "flex", alignItems: "center", gap: 2, bgcolor, borderRadius: 2 }} elevation={3}>
    {icon}
    <Box>
      <Typography variant="subtitle2" color="#525252">
        {title}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="#000">
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default AdminDashboard;