import {
  Container,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Switch,
  FormControlLabel,
  Box,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/el";
import { Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

dayjs.locale("el");

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Nova() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [emailHistory, setEmailHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("nova_dark") === "true";
  });

  const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
});

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/");
};




const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalResults, setTotalResults] = useState(0);
const limit = 10;
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
const navigate = useNavigate();

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  const token = localStorage.getItem("token");

const fetchEmailHistory = async () => {
  try {
    const params = {
      page,
      limit,
      search,
    };

    if (startDate) params.startDate = dayjs(startDate).format("YYYY-MM-DD");
    if (endDate) params.endDate = dayjs(endDate).format("YYYY-MM-DD");

    const res = await axios.get(`/api/email-history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    setEmailHistory(res.data.data);
    setTotalPages(res.data.totalPages);
    setTotalResults(res.data.total);
  } catch (err) {
    console.error("❌ Failed to fetch history", err);
  }
};




useEffect(() => {
  fetchEmailHistory();
}, [sent, page, search, startDate, endDate]);


  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setError("Εισάγετε έγκυρο email");
      return;
    }

    try {
      await axios.post(`/api/send-welcome-email`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSent(true);
      setEmail("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Απέτυχε η αποστολή.");
    }
  };

const handleExportCSV = async () => {
  try {
    const res = await axios.get(`/api/email-history/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "email_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("❌ Export failed", err);
  }
};


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom="1px solid #ccc">
  <Typography variant="h6">Project Nova</Typography>
  
  <Box display="flex" alignItems="center" gap={2}>
    <Typography variant="body2">
      {user?.fullName} | {user?.role}
    </Typography>

  <Button
    variant="outlined"
    startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
    onClick={() => setDarkMode(!darkMode)}
  >
    {darkMode ? "Light" : "Dark"}
  </Button>

  <Button
    variant="outlined"
    startIcon={<Logout />}
    color="error"
    onClick={handleLogout}
  >
    Logout
  </Button>
  </Box>
</Box>

      
      
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Project Nova</Typography>
        </Box>

        <Typography mb={2}>
          Συμπλήρωσε το email του πελάτη και θα λάβει τις πληροφορίες!
        </Typography>

        <TextField
          fullWidth
          type="email"
          label="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setSent(false);
          }}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />


        <Button fullWidth variant="contained" onClick={handleSubmit}>
          ΑΠΟΣΤΟΛΗ EMAIL
        </Button>

        <Snackbar
          open={sent}
          autoHideDuration={3000}
          onClose={() => setSent(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" variant="filled">
            ✅ Το email στάλθηκε με επιτυχία!
          </Alert>
        </Snackbar>

<Box display="flex" justifyContent="space-between" alignItems="center" mt={5} mb={2}>
  <TextField
    label="Αναζήτηση email"
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setPage(1); // reset page όταν αλλάζει το search
    }}
    size="small"
    sx={{ flex: 1, mr: 2 }}
  />
</Box>
   


        <Box mt={4} mb={2}>
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Από"
    format="DD/MM/YYYY"
    value={startDate}
    onChange={(newValue) => {
      setStartDate(newValue);
      setPage(1);
    }}
    sx={{ mr: 2 }}
  />
  <DatePicker
    label="Έως"
    format="DD/MM/YYYY"
    value={endDate}
    onChange={(newValue) => {
      setEndDate(newValue);
      setPage(1);
    }}
    sx={{ mr: 2 }}
  />
</LocalizationProvider>


        <Button
        variant="outlined"
        onClick={handleExportCSV}
        sx={{ mb: 2 }}
        >
        📥 Εξαγωγή σε CSV
        </Button>



<Box mt={3} display="flex" justifyContent="center" gap={2}>
  <Button
    variant="outlined"
    disabled={page === 1}
    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
  >
    ⬅ Προηγούμενη
  </Button>
  <Button
    variant="outlined"
    disabled={page === totalPages}
    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
  >
    Επόμενη ➡
  </Button>
</Box>


<Box mt={4}>
  <Typography variant="h6" gutterBottom>
    Αποστολές Email - Σύνολο: {totalResults} ({page}/{totalPages})
  </Typography>
<TableContainer component={Paper} sx={{ mt: 2 }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell><strong>Email</strong></TableCell>
        <TableCell><strong>Ημερομηνία</strong></TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {emailHistory.map((item, i) => (
        <TableRow key={i}>
          <TableCell>{item.email}</TableCell>
          <TableCell>
            {dayjs(item.sentAt).tz("Europe/Athens").format("DD/MM/YYYY HH:mm")}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

</Box>

        </Box>
      </Container>
    </ThemeProvider>
  );
}