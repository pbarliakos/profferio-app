import React, { useState, useEffect } from "react";
import {
  Container, TextField, Button, Typography, Paper, Grid, Card, CardContent, RadioGroup,
  FormControlLabel, Radio, Divider, CircularProgress, Box, CssBaseline, Pagination
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "../components/Header";
import SuccessAnimation from "../components/SuccessAnimation";

const API = process.env.REACT_APP_API_URL;

const alterlifeTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#121212",
    },
    primary: {
      main: "#fff000",
    },
    text: {
      primary: "#ffffff",
      secondary: "#cccccc",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    fontWeightBold: 700,
  },
});

const Alterlife = () => {
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

useEffect(() => {
  if (!user || !user._id) return;

  const today = new Date().toISOString().slice(0, 10);
  const defaultFilters = { customerId: "", from: today, to: today };

  setHistoryFilters(defaultFilters);
  handleSearchHistory(1, defaultFilters);
}, [user]);


  const [searchHistory, setSearchHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [historyFilters, setHistoryFilters] = useState({ customerId: "", from: "", to: "" });

  const token = localStorage.getItem("token");

  const hasAccess = user && (user.role === "admin" || user.project === "alterlife");
  if (!hasAccess) {
    return (
      <ThemeProvider theme={alterlifeTheme}>
        <CssBaseline />
        <Header user={user} token={token} project="Alterlife" />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h6" color="error">
            ⛔ Δεν έχετε δικαίωμα πρόσβασης σε αυτό το project.
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  const handleSearch = async () => {
    setCustomer(null);
    setHistory([]);
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/alterlife/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setHistory(data.history);
      } else {
        setMessage("❌ Πελάτης δεν βρέθηκε.");
      }
    } catch (err) {
      setMessage("❌ Σφάλμα διακομιστή.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/alterlife/${customerId}/select-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedOffer }),
      });

      if (res.ok) {
        setMessage("");
        setShowSuccess(true);
        setSelectedOffer("");
        handleSearch();
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        setMessage("❌ Σφάλμα κατά την καταχώρηση.");
      }
    } catch (err) {
      setMessage("❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchHistory = async (pageNumber = 1, filters = historyFilters) => {
    try {
      const params = new URLSearchParams({ ...filters, page: pageNumber, limit: 20 }).toString();
      const res = await fetch(`${API}/api/alterlife/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSearchHistory(data.results);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("❌ History search error", err);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    handleSearchHistory(value);
  };

  return (
    <ThemeProvider theme={alterlifeTheme}>
      <CssBaseline />
      <Header user={user} token={token} project="Alterlife" />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Αναζήτηση Πελάτη (Alterlife)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={9}>
            <TextField
              label="Κωδικός πελάτη"
              fullWidth
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </Grid>
          <Grid item xs={3}>
            <Button variant="contained" onClick={handleSearch} fullWidth sx={{ height: "100%" }}>
              Αναζήτηση
            </Button>
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {message && (
          <Typography color={message.startsWith("✅") ? "green" : "red"} sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}

        {customer && (
          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6">{customer.fullName}</Typography>
            <Typography variant="body2">Email: {customer.email}</Typography>
            <Typography variant="body2">Τηλέφωνο: {customer.phone}</Typography>
            <Typography variant="body2">Ημερομηνία γέννησης: {customer.birthdate?.slice(0, 10)}</Typography>
            <Typography variant="body2">Γυμναστήριο: {customer.gym}</Typography>
            <Typography variant="body2">Τρέχουσα υπηρεσία: {customer.currentService}</Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">Επιλογή Προσφοράς</Typography>
            <RadioGroup
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value)}
            >
              <FormControlLabel value={customer.offer1} control={<Radio />} label={customer.offer1} />
              <FormControlLabel value={customer.offer2} control={<Radio />} label={customer.offer2} />
              <FormControlLabel value={customer.offer3} control={<Radio />} label={customer.offer3} />
            </RadioGroup>

            <Button
              variant="contained"
              color="primary"
              disabled={!selectedOffer}
              onClick={handleConfirm}
              sx={{ mt: 2 }}
            >
              Επιβεβαίωση Επιλογής
            </Button>

            <SuccessAnimation show={showSuccess} />
          </Paper>
        )}

        {history.length > 0 && (
          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6">📜 Ιστορικό Επιλογών</Typography>
            {history.map((h, i) => (
              <Card key={i} sx={{ mt: 2 }}>
                <CardContent>
                  <Typography>
                    ✅ Επιλέχθηκε: <strong>{h.selectedOffer}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Από: {h.selectedBy?.username || "—"} | Ημερομηνία: {new Date(h.selectedAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        )}

        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6">🔎 Αναζήτηση Ιστορικού</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                label="Κωδικός πελάτη"
                fullWidth
                value={historyFilters.customerId}
                onChange={(e) => setHistoryFilters({ ...historyFilters, customerId: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                type="date"
                label="Από"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={historyFilters.from}
                onChange={(e) => setHistoryFilters({ ...historyFilters, from: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                type="date"
                label="Έως"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={historyFilters.to}
                onChange={(e) => setHistoryFilters({ ...historyFilters, to: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button variant="outlined" onClick={() => handleSearchHistory(1)} sx={{ mt: 2 }}>
            Αναζήτηση Ιστορικού
          </Button>

          {searchHistory.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {searchHistory.map((item, idx) => (
                <Card key={idx} sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography>
                      ✅ <strong>{item.selectedOffer}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Κωδικός: {item.customerId} | Από: {item.selectedBy?.username || "—"} | {new Date(item.selectedAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              <Pagination count={totalPages} page={page} onChange={handlePageChange} sx={{ mt: 2 }} />
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Alterlife;