import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Button, Paper, Chip,
  TextField, Divider, Avatar, List, ListItem, ListItemAvatar,
  IconButton, Tooltip, Stack, CircularProgress, Alert, useTheme, Switch, FormControlLabel
} from "@mui/material";
import {
  ArrowBack, Send, AttachFile, Person, SupportAgent,
  Cancel, Pending, CloudUpload, Download,
  Refresh, LightMode, DarkMode, Logout,
  AssignmentInd, PlayArrow, CalendarMonth, Lock
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const getStatusColor = (status) => {
  switch (status) {
    case "Open": return "error";
    case "Assigned": return "info";
    case "In Progress": return "warning";
    case "Scheduled": return "secondary";
    case "Reply by IT": return "primary";
    case "Waiting for Reply": return "success";
    case "Closed": return "default";
    default: return "default";
  }
};

const TicketDetails = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // ✅ ΑΥΣΤΗΡΟΙ ΡΟΛΟΙ
  const isAdmin = user.role === "admin"; // Μόνο ο Admin βλέπει τα Internal Notes
  const isAgent = user.role === "admin" || user.role === "team leader";

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout"); } 
    catch (err) { console.error(err); } 
    finally { localStorage.clear(); navigate("/"); }
  };

  const fetchTicket = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tickets/${id}`);
      setTicket(res.data);
      setError("");
    } catch (err) { setError("Ticket not found or unauthorized."); } 
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  
  useEffect(() => {
    if (ticket && ticket.history.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [ticket?.history]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 5));
    e.target.value = null;
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            const file = new File([blob], `pasted_image_${dayjs().format("HHmmss")}.png`, { type: blob.type });
            setFiles((prev) => [...prev, file].slice(0, 5));
            e.preventDefault(); 
        }
    }
  };

  const handleUpdate = async (newStatus = null) => {
    if (!reply && !newStatus && files.length === 0) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (reply) formData.append("comment", reply);
      if (newStatus) formData.append("status", newStatus);
      if (isInternal) formData.append("isInternal", "true");
      
      files.forEach((file) => formData.append("attachments", file));

      const token = localStorage.getItem("token");
      await axios.put(`/api/tickets/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setReply("");
      setFiles([]);
      setIsInternal(false);
      fetchTicket();
    } catch (err) { alert("Error updating ticket."); } 
    finally { setSubmitting(false); }
  };

  if (loading) return <Box p={5} pt={15} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!ticket) return <Box p={5} pt={15}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ 
        height: "100vh", width: "100vw", bgcolor: "background.default", 
        pt: 0, pb: 2, display: "flex", justifyContent: "center", overflow: "hidden" 
    }}>
      <Box sx={{ 
          width: "85%", maxWidth: "1600px", display: "flex", flexDirection: "column", height: "95%"
      }}>

        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexShrink={0}>
            <Box display="flex" alignItems="center" gap={2}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate("/tickets")} variant="outlined" size="medium">
                    Back
                </Button>
                <Box>
                    <Typography variant="h5" fontWeight="800">
                        {ticket.ticketId}: {ticket.subject}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" mt={0.5}>
                        <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" sx={{ fontWeight: 'bold' }} />
                        <Typography variant="body2" color="text.secondary">
                            Created by {ticket.createdBy?.fullName} • {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                    </Stack>
                </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2" sx={{ opacity: 0.7, display: { xs: 'none', md: 'block' }, fontWeight: 500, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                    {user.fullName} | <strong>{user.project}</strong>
                </Typography>

                <Tooltip title="Ανανέωση Chat"><IconButton onClick={fetchTicket} color="primary"><Refresh /></IconButton></Tooltip>
                <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}><IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">{darkMode ? <LightMode /> : <DarkMode />}</IconButton></Tooltip>
                <Tooltip title="Logout"><IconButton onClick={handleLogout} color="error"><Logout /></IconButton></Tooltip>
            </Stack>
        </Box>

        {/* CONTENT LAYOUT */}
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden', width: '100%' }}>
            
            {/* LEFT COLUMN (CHAT) */}
            <Paper elevation={3} sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box p={2} bgcolor="action.hover" borderBottom={1} borderColor="divider">
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">Περιγραφή:</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>
                </Box>

                <List sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'background.paper', p: 2 }}>
                    {ticket.history.map((item, index) => {
                        // ✅ ΑΝ ΕΙΝΑΙ INTERNAL KAI ΔΕΝ ΕΙΣΑΙ ADMIN -> ΔΕΝ ΤΟ ΒΛΕΠΕΙΣ
                        if (item.isInternal && !isAdmin) return null;

                        const isSystem = item.action === "STATUS_CHANGE" || item.action === "CREATED";
                        const isMe = item.user?._id === user._id;
                        
                        if (isSystem) return (
                            <Box key={index} display="flex" justifyContent="center" my={2}>
                                <Chip label={`${dayjs(item.timestamp).format("HH:mm")} - ${item.details} (${item.userName})`} size="small" sx={{ opacity: 0.8, fontSize: '0.8rem' }} />
                            </Box>
                        );

                        return (
                            <ListItem key={index} alignItems="flex-start" sx={{ flexDirection: isMe ? 'row-reverse' : 'row', mb: 1 }}>
                                <ListItemAvatar sx={{ mx: 1.5 }}>
                                    <Avatar sx={{ bgcolor: isMe ? 'primary.main' : 'secondary.main', width: 40, height: 40 }}>
                                        {isMe ? <Person fontSize="small" /> : <SupportAgent fontSize="small" />}
                                    </Avatar>
                                </ListItemAvatar>
                                
                                {/* ✅ STYLING ΓΙΑ NOTES */}
                                <Paper sx={{ 
                                    p: 2, maxWidth: '85%', borderRadius: 2,
                                    // 🟡 ΚΙΤΡΙΝΟ (#ffeb3b) για Notes, ΜΑΥΡΑ γράμματα
                                    bgcolor: item.isInternal ? '#ffeb3b' : (isMe ? 'primary.main' : 'background.paper'),
                                    color: item.isInternal ? '#000' : (isMe ? '#fff' : 'text.primary'),
                                    border: item.isInternal ? '2px solid #fbc02d' : (isMe ? 'none' : '2px solid #81D4FA'), 
                                    boxShadow: isMe ? 3 : 0
                                }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        {/* 🔒 INTERNAL BADGE */}
                                        {item.isInternal && (
                                            <Chip 
                                                icon={<Lock style={{ color: 'black', fontSize: 14 }} />} 
                                                label="INTERNAL NOTE" 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: '#f57f17', 
                                                    color: 'black', 
                                                    fontWeight: '900', 
                                                    fontSize: '0.65rem', 
                                                    height: 20,
                                                    '& .MuiChip-label': { px: 1 }
                                                }} 
                                            />
                                        )}
                                        
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'inherit' }}>
                                            {item.userName}
                                        </Typography>
                                        <Typography component="span" variant="caption" sx={{ opacity: 0.8, color: 'inherit' }}>
                                            {dayjs(item.timestamp).format("DD/MM HH:mm")}
                                        </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'inherit', fontWeight: item.isInternal ? '500' : '400' }}>
                                        {item.details}
                                    </Typography>
                                    {item.files?.length > 0 && <Box mt={1.5}>{item.files.map((file, i) => <Button key={i} size="small" startIcon={<Download fontSize="small" />} href={`http://localhost:5000/${file}`} target="_blank" sx={{ color: 'inherit', display: 'block', borderColor: 'inherit', mb: 0.5 }} variant="outlined">Attachment {i+1}</Button>)}</Box>}
                                </Paper>
                            </ListItem>
                        );
                    })}
                    <div ref={bottomRef} />
                </List>
                
                {ticket.status !== "Closed" && (
                    <Box p={3} borderTop={1} borderColor="divider" bgcolor="background.default">
                        <TextField 
                            fullWidth multiline rows={3} 
                            placeholder={isInternal ? "Εσωτερική Σημείωση (Μόνο για Admins)..." : "Γράψτε την απάντησή σας (Ctrl+V για εικόνες)..."} 
                            value={reply} onChange={(e) => setReply(e.target.value)} 
                            onPaste={handlePaste}
                            sx={{ 
                                mb: 2, 
                                bgcolor: isInternal ? '#fff9c4' : 'background.paper', // Κίτρινο όταν γράφεις note
                                '& .MuiInputBase-input': {
                                    color: isInternal ? '#000' : 'text.primary', // Μαύρα γράμματα
                                    fontWeight: isInternal ? 'bold' : 'normal'
                                }
                            }} 
                        />
                        
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box onClick={() => fileInputRef.current.click()} sx={{ border: '2px dashed', borderColor: 'grey.400', borderRadius: 2, p: 1, px: 2, textAlign: 'center', cursor: 'pointer', bgcolor: 'background.paper', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <AttachFile color="action" sx={{ fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary">{files.length > 0 ? `${files.length} files` : "Attach / Paste Image"}</Typography>
                            </Box>

                            {/* ✅ Toggle ΜΟΝΟ για Admin */}
                            {isAdmin && (
                                <FormControlLabel 
                                    control={<Switch checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} color="warning" />} 
                                    label={<Typography variant="body2" fontWeight="bold" color="warning.main">Internal Note</Typography>}
                                />
                            )}
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            {isAgent && !isInternal && (
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Button size="medium" variant="outlined" color="info" startIcon={<AssignmentInd />} onClick={() => handleUpdate("Assigned")}>Assign Me</Button>
                                    <Button size="medium" variant="outlined" color="warning" startIcon={<PlayArrow />} onClick={() => handleUpdate("In Progress")}>Work Now</Button>
                                    <Button size="medium" variant="outlined" color="secondary" startIcon={<CalendarMonth />} onClick={() => handleUpdate("Scheduled")}>Schedule</Button>
                                </Stack>
                            )}
                            <Button 
                                variant="contained" 
                                size="medium" 
                                color={isInternal ? "warning" : "primary"}
                                sx={{ px: 3, py: 1, fontWeight: 'bold', color: isInternal ? 'black' : 'white' }} 
                                endIcon={submitting ? <CircularProgress size={20} color="inherit"/> : (isInternal ? <Lock /> : <Send />)} 
                                onClick={() => handleUpdate()} 
                                disabled={submitting || (!reply && files.length === 0)}
                            >
                                {isInternal ? "Save Note" : "Reply"}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* DETAILS SECTION */}
            <Paper elevation={3} sx={{ width: '320px', flexShrink: 0, p: 3, borderRadius: 2, overflowY: 'auto' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Λεπτομέρειες</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Κατηγορία</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{ticket.category}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Προτεραιότητα</Typography>
                        <Chip label={ticket.priority} sx={{ bgcolor: ticket.priority === 'Critical' ? '#d32f2f' : ticket.priority === 'High' ? 'orange' : '#4caf50', color: 'white', fontWeight: 'bold', height: 28, mt: 0.5 }} />
                    </Box>
                    
                    <Box>
                        <Typography variant="body2" color="text.secondary">Διαχειριστής (Assignee)</Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" mt={0.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: ticket.assignedTo ? 'primary.main' : 'grey.400', fontSize: 14 }}>
                                {ticket.assignedTo?.fullName?.charAt(0) || "?"}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {ticket.assignedTo?.fullName || "Unassigned"}
                            </Typography>
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">Ημερομηνία Δημιουργίας</Typography>
                        <Typography variant="body1">{dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}</Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">Τελευταία Ενημέρωση</Typography>
                        <Typography variant="body1">{dayjs(ticket.updatedAt).format("DD/MM/YYYY HH:mm")}</Typography>
                    </Box>

                    {ticket.project && (
                        <Box>
                            <Typography variant="body2" color="text.secondary">Project</Typography>
                            <Typography variant="body1">{ticket.project}</Typography>
                        </Box>
                    )}
                </Stack>
                
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Αρχικά Συνημμένα</Typography>
                {ticket.attachments?.length > 0 ? ticket.attachments.map((file, i) => <Button key={i} variant="outlined" size="small" startIcon={<CloudUpload fontSize="small" />} fullWidth href={`http://localhost:5000/${file}`} target="_blank" sx={{ mb: 1 }}>Λήψη {i + 1}</Button>) : <Typography variant="body2" color="text.secondary">Κανένα.</Typography>}
                
                <Divider sx={{ my: 3 }} />
                <Stack spacing={2}>
                    {ticket.status !== "Closed" ? (
                        <Button variant="contained" color="error" size="medium" startIcon={<Cancel />} fullWidth onClick={() => { if(window.confirm("Close ticket?")) handleUpdate("Closed"); }}>Close Ticket</Button>
                    ) : (
                        <Button variant="contained" color="warning" size="medium" startIcon={<Pending />} fullWidth onClick={() => handleUpdate("Open")}>Reopen Ticket</Button>
                    )}
                </Stack>
            </Paper>

        </Box>
      </Box>
    </Box>
  );
};

export default TicketDetails;