import React, { useState, useRef } from "react";
import {
  Box, Typography, Button, Paper, TextField, MenuItem,
  Grid, Snackbar, Alert, IconButton, Stack, Tooltip, useTheme, Chip, CircularProgress
} from "@mui/material";
import {
  CloudUpload, Send, ArrowBack, AttachFile,
  LightMode, DarkMode, Logout
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Hardware", "Software", "Network", "Access Rights", "CRM/ERP", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const CreateTicket = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ Παίρνουμε τα στοιχεία του χρήστη για το Header
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    subject: "", category: "", priority: "", description: ""
  });
  const [files, setFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout"); } 
    catch (err) { console.error(err); } 
    finally { localStorage.clear(); navigate("/"); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => {
        const newFiles = [...prev, ...selectedFiles];
        if (newFiles.length > 5) {
            setSnackbar({ open: true, message: "Max 5 files", severity: "warning" });
            return newFiles.slice(0, 5);
        }
        return newFiles;
    });
    e.target.value = null; 
  };

  const handleRemoveFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.category || !formData.priority || !formData.description) {
        setSnackbar({ open: true, message: "Συμπληρώστε όλα τα πεδία.", severity: "warning" });
        return;
    }
    setLoading(true);
    try {
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        files.forEach((file) => data.append("attachments", file));

        const token = localStorage.getItem("token");
        await axios.post("/api/tickets", data, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });

        setSnackbar({ open: true, message: "Ticket created!", severity: "success" });
        setTimeout(() => navigate("/tickets"), 1500);
    } catch (err) {
        setSnackbar({ open: true, message: "Error creating ticket.", severity: "error" });
        setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", width: "100vw", bgcolor: "background.default", pt: 2, pb: 2, display: "flex", justifyContent: "center", overflow: "hidden" }}>
      <Box sx={{ width: "85%", maxWidth: "1600px", display: "flex", flexDirection: "column", height: "90%" }}>

        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexShrink={0}>
            <Box display="flex" alignItems="center" gap={2}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate("/tickets")} variant="outlined" size="medium">Back</Button>
                <Typography variant="h5" fontWeight="800">New Ticket</Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
                {/* ✅ USER INFO */}
                <Typography variant="subtitle2" sx={{ opacity: 0.7, display: { xs: 'none', md: 'block' }, fontWeight: 500, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                    {user.fullName} | <strong>{user.project}</strong>
                </Typography>

                <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}><IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">{darkMode ? <LightMode /> : <DarkMode />}</IconButton></Tooltip>
                <Tooltip title="Logout"><IconButton onClick={handleLogout} color="error"><Logout /></IconButton></Tooltip>
            </Stack>
        </Box>

        {/* CONTENT */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, flexGrow: 1, overflowY: 'auto', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 4-4-4 Grid με κανονικά μεγέθη */}
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={4}>
                        <TextField 
                            label="Θέμα / Τίτλος *" name="subject" fullWidth 
                            value={formData.subject} onChange={handleChange} required 
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4}>
                        <TextField 
                            select label="Κατηγορία *" name="category" fullWidth 
                            value={formData.category} onChange={handleChange} required
                            SelectProps={{ displayEmpty: true, renderValue: (s) => s ? s : <Typography color="text.secondary" sx={{ opacity: 0.7 }}>Επέλεξε κατηγορία</Typography> }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="" disabled><em>Επέλεξε κατηγορία</em></MenuItem>
                            {CATEGORIES.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={4}>
                        <TextField 
                            select label="Προτεραιότητα *" name="priority" fullWidth 
                            value={formData.priority} onChange={handleChange} required
                            SelectProps={{ displayEmpty: true, renderValue: (s) => s ? s : <Typography color="text.secondary" sx={{ opacity: 0.7 }}>Επέλεξε Προτεραιότητα</Typography> }}
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="" disabled><em>Επέλεξε Προτεραιότητα</em></MenuItem>
                            {PRIORITIES.map((prio) => <MenuItem key={prio} value={prio} sx={{ color: prio === 'Critical' ? 'red' : prio === 'High' ? 'orange' : 'inherit' }}>{prio}</MenuItem>)}
                        </TextField>
                    </Grid>
                </Grid>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.secondary">Περιγραφή *</Typography>
                    <TextField 
                        name="description" fullWidth multiline rows={8} 
                        value={formData.description} onChange={handleChange} required 
                        placeholder="Γράψτε εδώ όλες τις λεπτομέρειες..."
                        sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
                
                <Grid container spacing={3} alignItems="flex-start">
                    <Grid item xs={12} lg={8}>
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                        <Box onClick={() => fileInputRef.current.click()} sx={{ 
                            border: '2px dashed', borderColor: 'grey.500', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer', 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'action.hover', transition: '0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' }
                        }}>
                            <CloudUpload sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">{files.length > 0 ? `${files.length} αρχεία επιλέχθηκαν` : "Κλικ για επισύναψη αρχείων (Max 5MB)"}</Typography>
                        </Box>
                        {files.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
                                {files.map((file, i) => <Chip key={i} label={file.name} onDelete={() => handleRemoveFile(i)} icon={<AttachFile />} variant="outlined" size="small" />)}
                            </Stack>
                        )}
                    </Grid>

                    <Grid item xs={12} lg={4} display="flex" justifyContent="flex-end">
                        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', borderRadius: 2 }} startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Send />}>
                            {loading ? "Sending..." : "Create Ticket"}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default CreateTicket;