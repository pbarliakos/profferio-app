import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";

const AgentMonitor = ({ darkMode }) => { // Πρόσθεσα το darkMode prop αν το χρειάζεσαι για styling
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/auth/open-sessions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSessions(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: "Αποτυχία λήψης δεδομένων.", severity: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceLogout = async (sessionId, userId) => {
    try {
      await axios.post(
        "/api/auth/force-logout",
        { 
            logId: sessionId, // ✅ Στέλνουμε το συγκεκριμένο Session ID
            userId: userId    // ✅ Στέλνουμε και το User ID για το κλείσιμο του TimeDaily
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSnackbar({ open: true, message: "Ο agent αποσυνδέθηκε!", severity: "success" });
      fetchSessions(); // Refresh της λίστας
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Αποτυχία force logout.", severity: "error" });
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        👀 Παρακολούθηση Ενεργών Agent Sessions
      </Typography>
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
             <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Agent</strong></TableCell>
                <TableCell><strong>Ονοματεπώνυμο</strong></TableCell>
                <TableCell><strong>Project</strong></TableCell>
                <TableCell><strong>Ώρα Login</strong></TableCell>
                <TableCell><strong>Ενέργειες</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Κανένα ενεργό session
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>{session.username || session.userId?.username || "Unknown"}</TableCell>
                    <TableCell>{session.fullName || session.userId?.fullName || "-"}</TableCell>
                    <TableCell>{session.project || session.userId?.project || "-"}</TableCell>
                    <TableCell>
                      {session.loginAt ? dayjs(session.loginAt).format("DD/MM/YYYY HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleForceLogout(session._id, session.userId?._id || session.userId)}
                      >
                        Force Logout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentMonitor;