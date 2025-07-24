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
  const [searchHistory, setSearchHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const [historyFilters, setHistoryFilters] = useState({ customerId: "", from: today, to: today });

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

  useEffect(() => {
    handleSearchHistory(1);
  }, []);

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

  const handleSearchHistory = async (pageNumber = 1) => {
    try {
      const params = new URLSearchParams({ ...historyFilters, page: pageNumber, limit: 20 }).toString();
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
        {/* Τα υπόλοιπα components παραμένουν ίδια όπως στο αρχείο σου */}
      </Container>
    </ThemeProvider>
  );
};

export default Alterlife;