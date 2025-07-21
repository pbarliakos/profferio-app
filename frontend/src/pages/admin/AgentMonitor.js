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

const AgentMonitor = () => {
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
        { userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSnackbar({ open: true, message: "Ο agent αποσυνδέθηκε!", severity: "success" });
      fetchSessions();
    } catch (err) {
      setSnackbar({ open: true, message: "Αποτυχία force logout.", severity: "error" });
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        👀 Παρακολούθηση Ενεργών Agent Sessions
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Ονοματεπώνυμο</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Ώρα Login</TableCell>
                <TableCell>Force Logout</TableCell>
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
                    <TableCell>{session.username || session.userId?.username}</TableCell>
                    <TableCell>{session.fullName || session.userId?.fullName}</TableCell>
                    <TableCell>{session.project || session.userId?.project}</TableCell>
                    <TableCell>
                      {session.loginAt ? dayjs(session.loginAt).format("DD/MM/YYYY HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleForceLogout(session._id, session.userId?._id || session.userId)}
                        size="small"
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
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentMonitor;
