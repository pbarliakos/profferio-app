import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Delete, Edit, Add, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MenuItem from '@mui/material/MenuItem';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "user",
    project: "alterlife",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

useEffect(() => {
  fetchUsers();
}, []);

  const fetchUsers = async () => {
    const res = await axios.get("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({ ...user, password: "" });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Σίγουρα θες να διαγράψεις τον χρήστη;")) return;
    await axios.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSnackbar("Ο χρήστης διαγράφηκε");
    fetchUsers();
  };

  const handleSave = async () => {
    if (editingUser) {
      await axios.put(`/api/users/${editingUser._id}`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar("Ο χρήστης ενημερώθηκε");
    } else {
      await axios.post("/api/users", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar("Ο χρήστης δημιουργήθηκε");
    }

    setOpenDialog(false);
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredUsers = users.filter((u) =>
    `${u.username} ${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { field: "fullName", headerName: "Ονοματεπώνυμο", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "role", headerName: "Ρόλος", flex: 1 },
    { field: "project", headerName: "Project", flex: 1 },
    {
      field: "actions",
      headerName: "Ενέργειες",
      renderCell: (params) => (
        <>
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
        </>
      ),
      width: 150,
    },
  ];

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Αναζήτηση"
          fullWidth
          margin="normal"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingUser(null);
            setNewUser({
              fullName: "",
              username: "",
              email: "",
              password: "",
              role: "user",
              project: "alterlife",
            });
            setOpenDialog(true);
          }}
          sx={{ ml: 2, mt: 2, height: "55px" }}
        >
          Νεος Χρηστης
        </Button>
      </Box>

      <DataGrid
        rows={filteredUsers}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        disableRowSelectionOnClick
      />

      {/* Dialog Create/Edit */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? "Επεξεργασία Χρήστη" : "Νέος Χρήστης"}</DialogTitle>
        <DialogContent>
          <TextField label="Ονοματεπώνυμο" fullWidth margin="dense" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
          <TextField label="Username" fullWidth margin="dense" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <TextField label="Email" fullWidth margin="dense" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <TextField label="Password" fullWidth margin="dense" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <TextField
        select
        label="Ρόλος"
        fullWidth
        margin="dense"
        value={newUser.role}
        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
        >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="manager">Manager</MenuItem>
        <MenuItem value="user">User</MenuItem>
        </TextField>

        <TextField
        select
        label="Project"
        fullWidth
        margin="dense"
        value={newUser.project}
        onChange={(e) => setNewUser({ ...newUser, project: e.target.value })}
        >
        <MenuItem value="alterlife">Alterlife</MenuItem>
        <MenuItem value="other">Other</MenuItem>
        </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Άκυρο</Button>
          <Button variant="contained" onClick={handleSave}>Αποθήκευση</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        message={snackbar}
        onClose={() => setSnackbar("")}
      />
    </Box>
  );
};

export default AdminDashboard;