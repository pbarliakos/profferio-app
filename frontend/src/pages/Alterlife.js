import React, { useState } from "react";
import {
  Container, TextField, Button, Typography, Paper, Grid, Card, CardContent, RadioGroup,
  FormControlLabel, Radio, Divider, CircularProgress, Box, CssBaseline
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
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

  const { token, user } = useAuth();

  // Access control: only allow admin or users with project 'alterlife'
  const hasAccess = user && (user.role === "admin" || user.projects?.includes("alterlife"));
  if (!hasAccess) {
    return (
      <ThemeProvider theme={alterlifeTheme}>
        <CssBaseline />
        <Header project="Alterlife" />
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

  return (
    <ThemeProvider theme={alterlifeTheme}>
      <CssBaseline />
      <Header project="Alterlife" />
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
      </Container>
    </ThemeProvider>
  );
};

export default Alterlife;